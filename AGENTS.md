<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application data
- Dashboard and Surveys share a Query cache populated by an authenticated workspace server function; scope reads to the user's first organization to match the existing shell.
- Survey writes use the authenticated RLS client, and input validation is shared between forms and the server to keep permission and data boundaries consistent.
- Dashboard CSAT aggregates satisfied and valid response counts using each survey's scale and threshold; never average percentages from different surveys.
