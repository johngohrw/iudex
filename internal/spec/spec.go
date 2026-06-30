// Package spec parses the PRD requirement format from .context/prd/*.md.
//
// A requirement is a markdown heading (any level) whose text matches
// "REQ-<n>: <title>"; other headings are ordinary prose. An optional
// "> status: <value>" line directly under the heading carries its status
// (active|parked|out-of-scope, default active); other "> key: value" lines are
// permitted and ignored. IDs are file-scoped integers, append-only. A
// "REQ-?:" heading is a draft placeholder that Fix resolves.
//
// This package is the single source of truth for the format: the parser is the
// executable definition, consumed by `iudex spec` (read) and `iudex spec lint`
// (validate/normalize), and through them by the GUI and the authoring skills.
package spec

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// Status values a requirement may carry. An omitted status means StatusActive.
const (
	StatusActive     = "active"
	StatusParked     = "parked"
	StatusOutOfScope = "out-of-scope"
)

var validStatus = map[string]bool{
	StatusActive:     true,
	StatusParked:     true,
	StatusOutOfScope: true,
}

// Requirement is one parsed requirement. JSON tags are the GUI read contract.
type Requirement struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	Status string `json:"status"`
	Body   string `json:"body"`
}

// PRD is one parsed PRD file: its basename, H1 title, and requirements (flat).
type PRD struct {
	File         string        `json:"file"`
	Title        string        `json:"title"`
	Requirements []Requirement `json:"requirements"`
}

// Severity classifies a lint Issue. v1 emits only warnings (warn-first); error
// is reserved for the future blocking cutover.
type Severity string

const (
	SeverityWarn  Severity = "warn"
	SeverityError Severity = "error"
)

// Issue is a single lint finding, with a 1-based line number.
type Issue struct {
	Line     int      `json:"line"`
	Severity Severity `json:"severity"`
	Message  string   `json:"message"`
}

var (
	// headingRe matches any ATX heading, capturing the hashes and the text.
	headingRe = regexp.MustCompile(`^(#{1,6})\s+(.*)$`)
	// reqRe matches a well-formed requirement heading's text: REQ-<n|?>: title.
	reqRe = regexp.MustCompile(`^REQ-(\d+|\?):\s*(.*\S.*)$`)
	// metaRe matches a metadata line directly under a heading: "> key: value".
	metaRe = regexp.MustCompile(`^>\s*([A-Za-z][\w-]*):\s*(.*)$`)
)

// Parse parses one PRD file's content. name is the file's basename, recorded on
// the returned PRD. Unrecognized content is preserved as requirement bodies or
// ignored prose; parsing never fails (malformed requirements are a lint
// concern, not a parse error), so the raw markdown stays ground truth.
func Parse(name string, content []byte) PRD {
	lines := splitLines(content)
	prd := PRD{File: name, Requirements: []Requirement{}}

	i := 0
	for i < len(lines) {
		h := headingRe.FindStringSubmatch(lines[i])
		if h == nil {
			i++
			continue
		}
		level := len(h[1])
		text := strings.TrimSpace(h[2])
		if level == 1 && prd.Title == "" {
			prd.Title = text
		}
		m := reqRe.FindStringSubmatch(text)
		if m == nil {
			i++
			continue
		}

		req := Requirement{
			ID:     "REQ-" + m[1],
			Title:  strings.TrimSpace(m[2]),
			Status: StatusActive,
		}
		i++

		// Metadata lines directly under the heading, until the first non-meta line.
		for i < len(lines) {
			mm := metaRe.FindStringSubmatch(lines[i])
			if mm == nil {
				break
			}
			if strings.EqualFold(mm[1], "status") {
				req.Status = strings.TrimSpace(mm[2])
			}
			i++
		}

		// Body runs until the next requirement heading or a same-or-shallower
		// section heading; deeper non-requirement headings stay part of the body.
		var body []string
		for i < len(lines) {
			if hl := headingRe.FindStringSubmatch(lines[i]); hl != nil {
				htext := strings.TrimSpace(hl[2])
				if reqRe.MatchString(htext) || len(hl[1]) <= level {
					break
				}
			}
			body = append(body, lines[i])
			i++
		}
		req.Body = strings.TrimSpace(strings.Join(body, "\n"))
		prd.Requirements = append(prd.Requirements, req)
	}
	return prd
}

// ParseAll parses every top-level *.md in prdDir, sorted by filename. A missing
// directory is not an error — it yields an empty slice (no PRDs authored yet).
func ParseAll(prdDir string) ([]PRD, error) {
	entries, err := os.ReadDir(prdDir)
	if errors.Is(err, os.ErrNotExist) {
		return []PRD{}, nil
	}
	if err != nil {
		return nil, err
	}
	prds := []PRD{}
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".md") {
			continue
		}
		data, err := os.ReadFile(filepath.Join(prdDir, e.Name()))
		if err != nil {
			return nil, err
		}
		prds = append(prds, Parse(e.Name(), data))
	}
	sort.Slice(prds, func(i, j int) bool { return prds[i].File < prds[j].File })
	return prds, nil
}

// Lint validates one PRD file's content and returns findings (warn-first: every
// finding is a warning in v1). It flags headings that start "REQ-" but aren't
// well-formed, unresolved REQ-? placeholders, duplicate ids within the file,
// and unknown status values.
func Lint(content []byte) []Issue {
	lines := splitLines(content)
	var issues []Issue
	seen := map[string]int{} // id -> first line it was defined on

	for idx, line := range lines {
		h := headingRe.FindStringSubmatch(line)
		if h == nil {
			continue
		}
		text := strings.TrimSpace(h[2])
		if !strings.HasPrefix(text, "REQ-") {
			continue
		}
		ln := idx + 1

		m := reqRe.FindStringSubmatch(text)
		if m == nil {
			issues = append(issues, Issue{ln, SeverityWarn,
				fmt.Sprintf("malformed requirement heading %q — expected 'REQ-<n>: <title>'", text)})
			continue
		}
		if m[1] == "?" {
			issues = append(issues, Issue{ln, SeverityWarn,
				"unresolved placeholder REQ-? — run 'iudex spec lint --fix' to assign an id"})
		} else {
			id := "REQ-" + m[1]
			if first, ok := seen[id]; ok {
				issues = append(issues, Issue{ln, SeverityWarn,
					fmt.Sprintf("duplicate %s (first defined at line %d)", id, first)})
			} else {
				seen[id] = ln
			}
		}

		// Validate status on the metadata lines directly under this heading.
		for j := idx + 1; j < len(lines); j++ {
			mm := metaRe.FindStringSubmatch(lines[j])
			if mm == nil {
				break
			}
			if strings.EqualFold(mm[1], "status") {
				val := strings.TrimSpace(mm[2])
				if !validStatus[val] {
					issues = append(issues, Issue{j + 1, SeverityWarn,
						fmt.Sprintf("unknown status %q — expected active, parked, or out-of-scope", val)})
				}
			}
		}
	}
	return issues
}

// Fix assigns ids to REQ-? placeholders, top-to-bottom, starting at the file's
// highest existing id + 1. It is the single authority for id minting and is
// strictly append-only: existing ids are never reused or renumbered. It returns
// the (possibly) rewritten content and whether anything changed.
func Fix(content []byte) ([]byte, bool) {
	lines := splitLines(content)

	maxID := 0
	for _, line := range lines {
		h := headingRe.FindStringSubmatch(line)
		if h == nil {
			continue
		}
		m := reqRe.FindStringSubmatch(strings.TrimSpace(h[2]))
		if m == nil || m[1] == "?" {
			continue
		}
		if n, err := strconv.Atoi(m[1]); err == nil && n > maxID {
			maxID = n
		}
	}

	changed := false
	next := maxID + 1
	for i, line := range lines {
		h := headingRe.FindStringSubmatch(line)
		if h == nil {
			continue
		}
		text := strings.TrimSpace(h[2])
		m := reqRe.FindStringSubmatch(text)
		if m == nil || m[1] != "?" {
			continue
		}
		newText := strings.Replace(text, "REQ-?", "REQ-"+strconv.Itoa(next), 1)
		lines[i] = h[1] + " " + newText
		next++
		changed = true
	}

	if !changed {
		return content, false
	}
	return []byte(strings.Join(lines, "\n")), true
}

// splitLines normalizes CRLF and splits into lines, preserving the line count so
// reconstructing with strings.Join round-trips a file (including a trailing
// newline, which appears as a final empty element).
func splitLines(content []byte) []string {
	return strings.Split(strings.ReplaceAll(string(content), "\r\n", "\n"), "\n")
}
