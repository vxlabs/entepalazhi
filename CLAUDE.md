# CLAUDE.md — entepalazhi

Project context. Read this fully before any task in this repo.
This document covers **what the platform is and what it stands for**. It does not prescribe architecture.

---

## What this is

A hyperlocal civic accountability and directory platform for **Palazhi, Kozhikode** — the area containing Hilite Business Park, ULCCS Business Park and Hilite Mall. Palazhi falls under Olavanna Grama Panchayat, which is the body most civic issues and RTI filings are directed to.

Published at **entepalazhi.in**, with the companion Instagram account **@ente_palazhi**.

It exists because this area is changing faster than its public infrastructure. Thousands of people work here daily, rental demand is high, hotels and restaurants keep opening — and the roads, drainage and streetlights have not kept pace. Nobody is keeping a public record of what was promised, what was funded, and what was actually delivered.

That record is the product.

## Who it serves

- **Residents of Palazhi and the surrounding Olavanna wards** who want to know why a road has been broken for two years and who is responsible for fixing it.
- **People who work at the business parks** — many of them looking for somewhere to live nearby, currently dependent on brokers and WhatsApp groups.
- **Local business owners** — hotels, restaurants, shops — who need to be findable by that population.

## The three layers

**Civic record.** Documented local issues — roads, drainage, streetlights, flooding — each one carrying what was sanctioned, when, for how much, by whom, and how long it has been outstanding. Backed by RTI filings and dated photographs.

**Noticeboard.** What is happening in Palazhi right now, in a form a resident can act on. See below.

**Local directory.** Rentals, restaurants, and businesses in the area, serving the same people the other two layers brought in.

The civic record earns trust. The noticeboard earns the habit of returning. The directory earns revenue. They are not separate products and they share one identity.

## The noticeboard

This is the site's "news", and it is deliberately a noticeboard rather than a news section. It reports **things, not conduct**: what is closed, what is cut off, what is opening, what has been sanctioned. It never characterises a person's actions or motives.

What belongs here:

- Water supply cuts, power shutdowns
- Road closures, diversions, work starting or stopping
- Flood and waterlogging alerts during monsoon
- Panchayat notices — meetings, tenders, works sanctioned
- RTI replies received, including refusals
- New openings — restaurants, hotels, shops

Every item carries a date and a source: an official notice, a published order, or first-hand observation with a photograph. No aggregation of other outlets' reporting, no rewriting of press coverage.

**Items expire, and this is a hard rule.** Each item has a relevance window; a water cut is dead the following day. The homepage surfaces only what is live. When nothing is live it says so plainly — an empty current noticeboard reads as maintained, a full stale one reads as abandoned. Never pad the homepage to look busy.

Long-lived items belong in the civic record, not here. If something is still true in three months, it is an issue, not a notice.

**Expiry is automatic, never manual.** Every notice is written with an explicit `liveUntil` date and drops off the home page on its own. Taking something down must never depend on the operator remembering — that is the first chore to be dropped in a busy week, and a stale flood alert in September damages trust more than having posted nothing.

**Two channels, two speeds.** Time-critical alerts — a water cut today, a road closed this morning, live waterlogging — belong on Instagram and WhatsApp, where the audience already is during an emergency and where the operator is already active. The website's dependable rhythm is a **weekly roundup of what changed in Palazhi**: one post a week, always shipped. Urgent items appear on the site too when there is time, but the weekly roundup is the commitment. A cadence that holds for years beats a feed that stops in month three.

## Home page

The home page answers one question: *what do I need to know about Palazhi today?*

Order of priority:

1. Anything urgent and live — flood alert, water cut, road closed today
2. The current noticeboard, most recent first, live items only
3. The longest-outstanding civic issues, with elapsed time
4. Directory entry point (once the directory exists)

During monsoon, waterlogging status takes the top of the page and everything else moves down.

## Editorial position

This is the part that matters most, and it is not negotiable.

The platform publishes **facts and documents**. It does not publish allegations, opinions about individuals, or inferred motives. Anger is a reasonable reaction to the record; it is never the product.

- Elapsed time attaches to **the work or the road**, never to a person. *"Sanctioned 14 Feb 2024 · Not started · 540 days"* is the voice. Framing a named individual as the subject of a countdown is not.
- Representatives appear as **jurisdiction and contact information**, in a neutral block, separate from the issue itself. Not in headlines. Not in share cards.
- Every claim traces to a source: a dated photo, an RTI reference, a work order. Unknown fields say *"Not known"* — never an assumption dressed as a fact.
- The record is append-only. Issues gain updates and change status; they are not rewritten. Credibility depends on the history staying visible.
- No comments, no reactions, no user-to-user surface. The platform is a record, not a forum.

If a request would place a person's name beside an unsourced claim, refuse it and explain why.

## Language

Malayalam and English, both first-class. Malayalam is not a translation of an English original — for most of the audience it is the primary language, and copy should be written to work in it rather than adapted into it.

## Identity

The reference point is the **Kerala public works notice board** — the painted board standing at every sanctioned worksite, listing scheme, amount, contractor and completion date. The platform is that board, kept honestly and kept updated.

This is not a visual flourish. It is the exact artifact the project holds the panchayat to, so the form carries the argument. Flat, printed, plainly typeset. Field labels and values. No gloss.

Tone follows from it: plain, specific, unexcited. The facts do the work.

## What it is not

- Not a news outlet. The noticeboard carries notices, not journalism — it never reports on a person's conduct, and it never aggregates or rewrites other outlets' coverage.
- Not a complaints forum or a discussion board.
- Not affiliated with any government body, party, or the business parks — and nothing in the naming, design or copy should imply otherwise.
- Not part of vxlabs. Separate brand, separate audience, separate voice.

## Operating reality

Run by one person, roughly 4–6 hours a week, alongside client work. Prefer whatever needs the least maintenance over whatever is most capable. A feature that requires weekly attention is a feature that will be abandoned.

## Ask before assuming

- Anything that places a person's name inside a claim
- Anything that makes unverified user submissions public
- Anything implying official or governmental status
- Anything adding a recurring cost or a standing maintenance burden
