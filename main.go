package main

import (
	"embed"
	"fmt"
	"os"

	"iudex/internal/cmd"
)

// Embed without the "all:" prefix so dot-prefixed files (e.g. macOS .DS_Store)
// are never bundled into the workspace scaffold.
//
//go:embed templates
var templatesFS embed.FS

func main() {
	if err := cmd.Execute(templatesFS); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
