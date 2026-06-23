You are resolving an in-progress git merge in THIS worktree: `main` was merged
into this ticket's branch and left conflicts. The two branches are siblings cut
from a shared base, so conflicts range from trivial (duplicated or adjacent
lines, import ordering) to genuinely semantic (both sides changed the same logic
in different ways).

For EACH conflicted file:

- If you can resolve it WITH CONFIDENCE, preserving BOTH sides' intent, do so,
  remove all conflict markers, and `git add` the file.
- If resolving it would require GUESSING about intended behavior you cannot
  determine from the code, do NOT guess and do NOT `git add` it — leave its
  conflict markers exactly as they are for a human to decide.

Then write a report to `.task/resolution.json` (overwrite it) with exactly this
shape:

    {"resolved":[{"file":"path","note":"what you did"}],"flagged":[{"file":"path","reason":"why it needs human judgment"}]}

Finally:

- If you resolved and staged EVERY conflicted file (nothing flagged), complete
  the merge with `git commit --no-edit`.
- If you flagged ANY file, do NOT commit — leave the merge in progress.

Touch only the conflicted files; change nothing else.
