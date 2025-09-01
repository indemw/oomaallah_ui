-- Create public gallery bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- Drop existing policies if they exist
drop policy if exists "Public can view gallery images" on storage.objects;
drop policy if exists "Admins can manage gallery images" on storage.objects;

-- Allow public read access to gallery images
create policy "Public can view gallery images"
  on storage.objects for select
  using (bucket_id = 'gallery');

-- Allow admins to upload, update and delete images in gallery
create policy "Admins can manage gallery images"
  on storage.objects for all
  using (
    bucket_id = 'gallery'
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('admin','super_admin')
    )
  )
  with check (
    bucket_id = 'gallery'
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('admin','super_admin')
    )
  );