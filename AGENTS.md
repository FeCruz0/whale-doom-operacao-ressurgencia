<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Behavior Rules

- **GIT COMMITS:** NEVER execute git commits (`git commit`) directly on behalf of the user. Instead, prepare the files, stage them if appropriate, and explicitly provide the exact Git commands for the user to review and run themselves.
