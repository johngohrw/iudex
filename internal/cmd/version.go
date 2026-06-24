package cmd

import "runtime/debug"

// version is the iudex version. Release builds inject a semantic version via
//
//	go build -ldflags "-X iudex/internal/cmd.version=v1.2.3" .
//
// For a plain `go build`, it stays empty and versionString falls back to the
// commit the Go toolchain stamps into the binary automatically (Go 1.18+).
var version = ""

// versionString reports the iudex version: the injected version if present,
// else "dev (<commit>[-dirty])" from the build's VCS stamp, else "dev".
func versionString() string {
	if version != "" {
		return version
	}
	bi, ok := debug.ReadBuildInfo()
	if !ok {
		return "dev"
	}
	var rev, dirty string
	for _, s := range bi.Settings {
		switch s.Key {
		case "vcs.revision":
			rev = s.Value
		case "vcs.modified":
			if s.Value == "true" {
				dirty = "-dirty"
			}
		}
	}
	if rev == "" {
		return "dev"
	}
	if len(rev) > 12 {
		rev = rev[:12]
	}
	return "dev (" + rev + dirty + ")"
}
