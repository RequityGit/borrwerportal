-- Allow authenticated users to create their own profile during onboarding
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
