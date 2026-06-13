package queue

import (
	"bufio"
	"os"
	"strings"
)

// ParseDependencies reads a ticket markdown file and returns the list of
// dependency ticket IDs declared under the "## Dependencies" heading.
// Returns nil, nil if the file is absent or the section is not present.
func ParseDependencies(ticketFile string) ([]string, error) {
	f, err := os.Open(ticketFile)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	defer f.Close()

	var deps []string
	inDeps := false
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)
		if trimmed == "## Dependencies" {
			inDeps = true
			continue
		}
		if inDeps {
			if strings.HasPrefix(trimmed, "## ") {
				break
			}
			if strings.HasPrefix(trimmed, "- ") {
				deps = append(deps, strings.TrimPrefix(trimmed, "- "))
			}
		}
	}
	return deps, scanner.Err()
}

// DepsReady returns true if every dependency declared in ticketFile is in
// "done" state according to allStates. A dep absent from allStates is treated
// as not-done. Returns true when there are no dependencies.
func DepsReady(ticketFile string, allStates map[string]string) (bool, error) {
	deps, err := ParseDependencies(ticketFile)
	if err != nil {
		return false, err
	}
	for _, dep := range deps {
		if allStates[dep] != "done" {
			return false, nil
		}
	}
	return true, nil
}
