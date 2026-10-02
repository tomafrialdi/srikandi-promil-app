-- "Approved": reviewed and signed off, waiting to be scheduled or published.
alter type public.content_status add value if not exists 'approved' after 'changes_requested';
