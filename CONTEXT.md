# Domain context

## Job

A Job is an HR-owned opening with a title, description, lifecycle status, and rubric version. Jobs are the top-level scope for candidate intake and evaluation.

## Document

A Document is one uploaded PDF resume stored for one Job. Its raw text, normalized text, extraction status, and file metadata are retained for auditability.

## Candidate

A Candidate is the structured interpretation of one Document. In the current workflow a candidate record is job-scoped through its source Document.

## Fit Review

A Fit Review is an immutable evaluation snapshot for one Job and a selected set of that Job's Candidates. It records the job context, model, prompt version, ranking, scores, and evidence.

## Boundary

Documents and Fit Reviews must never cross Job boundaries. A candidate selection for a review must contain only candidates belonging to the selected Job.
