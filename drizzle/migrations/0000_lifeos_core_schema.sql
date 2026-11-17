
-- =========================================================
-- PROFILES
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  currency text not null default 'INR',
  monthly_budget numeric(12,2) not null default 35000,
  daily_study_goal_minutes int not null default 180,
  notify_deadlines boolean not null default true,
  notify_habits boolean not null default true,
  notify_weekly_summary boolean not null default false,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Profiles: read own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Profiles: insert own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Profiles: update own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''), nullif(new.raw_user_meta_data->>'name',''), split_part(coalesce(new.email,''),'@',1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- TASKS
-- =========================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null check (char_length(title) between 1 and 300),
  notes text,
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  priority text not null default 'medium' check (priority in ('urgent','high','medium','low')),
  project text not null default 'Personal',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index tasks_user_idx on public.tasks(user_id);
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
alter table public.tasks enable row level security;
create policy "Tasks: own rows" on public.tasks for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.tasks_set_completed_at()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'done' and (tg_op = 'INSERT' or old.status <> 'done') and new.completed_at is null then
    new.completed_at := now();
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;
create trigger tasks_completed_at before insert or update on public.tasks
  for each row execute function public.tasks_set_completed_at();

-- =========================================================
-- STUDY
-- =========================================================
create table public.study_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null check (char_length(name) between 1 and 120),
  color text not null default 'indigo',
  weekly_goal_hours numeric(5,1) not null default 6 check (weekly_goal_hours > 0 and weekly_goal_hours <= 100),
  created_at timestamptz not null default now()
);
create index study_subjects_user_idx on public.study_subjects(user_id);
grant select, insert, update, delete on public.study_subjects to authenticated;
grant all on public.study_subjects to service_role;
alter table public.study_subjects enable row level security;
create policy "Subjects: own rows" on public.study_subjects for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  subject_id uuid not null references public.study_subjects(id) on delete cascade,
  topic text not null default '',
  minutes int not null check (minutes > 0 and minutes <= 1440),
  session_date date not null default current_date,
  created_at timestamptz not null default now()
);
create index study_sessions_user_idx on public.study_sessions(user_id);
grant select, insert, update, delete on public.study_sessions to authenticated;
grant all on public.study_sessions to service_role;
alter table public.study_sessions enable row level security;
create policy "Sessions: own rows" on public.study_sessions for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and exists (select 1 from public.study_subjects s where s.id = subject_id and s.user_id = auth.uid()));

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  subject_id uuid not null references public.study_subjects(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  exam_date date not null,
  created_at timestamptz not null default now()
);
create index exams_user_idx on public.exams(user_id);
grant select, insert, update, delete on public.exams to authenticated;
grant all on public.exams to service_role;
alter table public.exams enable row level security;
create policy "Exams: own rows" on public.exams for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and exists (select 1 from public.study_subjects s where s.id = subject_id and s.user_id = auth.uid()));

-- =========================================================
-- EXPENSES
-- =========================================================
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null check (char_length(title) between 1 and 200),
  amount numeric(12,2) not null check (amount > 0),
  category text not null default 'Other',
  spent_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
create index expenses_user_idx on public.expenses(user_id);
grant select, insert, update, delete on public.expenses to authenticated;
grant all on public.expenses to service_role;
alter table public.expenses enable row level security;
create policy "Expenses: own rows" on public.expenses for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- HABITS
-- =========================================================
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null check (char_length(name) between 1 and 120),
  color text not null default 'indigo',
  target_per_week int not null default 7 check (target_per_week between 1 and 7),
  created_at timestamptz not null default now()
);
create index habits_user_idx on public.habits(user_id);
grant select, insert, update, delete on public.habits to authenticated;
grant all on public.habits to service_role;
alter table public.habits enable row level security;
create policy "Habits: own rows" on public.habits for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  log_date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);
create index habit_logs_user_idx on public.habit_logs(user_id);
grant select, insert, update, delete on public.habit_logs to authenticated;
grant all on public.habit_logs to service_role;
alter table public.habit_logs enable row level security;
create policy "Habit logs: own rows" on public.habit_logs for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid()));

-- =========================================================
-- EVENTS
-- =========================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null check (char_length(title) between 1 and 200),
  event_date date not null,
  start_time time not null,
  end_time time not null,
  category text not null default 'personal' check (category in ('work','study','personal','health')),
  location text,
  created_at timestamptz not null default now()
);
create index events_user_idx on public.events(user_id, event_date);
grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "Events: own rows" on public.events for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- ACTIVITY FEED
-- =========================================================
create table public.activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  kind text not null,
  title text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_user_idx on public.activity(user_id, created_at desc);
grant select, delete on public.activity to authenticated;
grant all on public.activity to service_role;
alter table public.activity enable row level security;
create policy "Activity: read own" on public.activity for select to authenticated using (auth.uid() = user_id);
create policy "Activity: delete own" on public.activity for delete to authenticated using (auth.uid() = user_id);

create or replace function public.log_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_subject text;
  v_habit text;
begin
  if coalesce(current_setting('lifeos.seeding', true), 'off') = 'on' then
    return new;
  end if;

  if tg_table_name = 'tasks' then
    if tg_op = 'INSERT' then
      insert into activity (user_id, kind, title, meta) values (new.user_id, 'task_created', new.title, jsonb_build_object('priority', new.priority));
    elsif new.status = 'done' and old.status <> 'done' then
      insert into activity (user_id, kind, title, meta) values (new.user_id, 'task_completed', new.title, jsonb_build_object('project', new.project));
    end if;
  elsif tg_table_name = 'expenses' then
    insert into activity (user_id, kind, title, meta) values (new.user_id, 'expense_added', new.title, jsonb_build_object('amount', new.amount, 'category', new.category));
  elsif tg_table_name = 'study_sessions' then
    select name into v_subject from study_subjects where id = new.subject_id;
    insert into activity (user_id, kind, title, meta) values (new.user_id, 'study_logged', coalesce(nullif(new.topic,''), v_subject), jsonb_build_object('minutes', new.minutes, 'subject', v_subject));
  elsif tg_table_name = 'habit_logs' then
    select name into v_habit from habits where id = new.habit_id;
    insert into activity (user_id, kind, title, meta) values (new.user_id, 'habit_checked', coalesce(v_habit, 'Habit'), '{}'::jsonb);
  elsif tg_table_name = 'events' then
    insert into activity (user_id, kind, title, meta) values (new.user_id, 'event_created', new.title, jsonb_build_object('date', new.event_date));
  end if;
  return new;
end;
$$;

create trigger tasks_activity after insert or update on public.tasks for each row execute function public.log_activity();
create trigger expenses_activity after insert on public.expenses for each row execute function public.log_activity();
create trigger study_sessions_activity after insert on public.study_sessions for each row execute function public.log_activity();
create trigger habit_logs_activity after insert on public.habit_logs for each row execute function public.log_activity();
create trigger events_activity after insert on public.events for each row execute function public.log_activity();

-- =========================================================
-- DATA MANAGEMENT
-- =========================================================
create or replace function public.wipe_user_data(_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from activity where user_id = _uid;
  delete from habit_logs where user_id = _uid;
  delete from habits where user_id = _uid;
  delete from study_sessions where user_id = _uid;
  delete from exams where user_id = _uid;
  delete from study_subjects where user_id = _uid;
  delete from expenses where user_id = _uid;
  delete from events where user_id = _uid;
  delete from tasks where user_id = _uid;
end;
$$;

create or replace function public.seed_sample_data(_uid uuid, _today date)
returns void language plpgsql security definer set search_path = public as $$
declare
  d date := _today;
  s_dsa uuid; s_ml uuid; s_db uuid; s_jp uuid;
  h_run uuid; h_read uuid; h_med uuid; h_phone uuid; h_water uuid;
  i int; j int; m int;
  day date; dow int;
  mstart date; mend date;
  done_titles text[] := array[
    'Reply to placement cell email','Update resume with internship project','Code review: auth middleware',
    'Finish ML lab notebook','Clean up Notion study notes','Weekly grocery run','Call home',
    'Submit timesheet','Practice 3 LeetCode mediums','Refactor API error handling','Back up laptop',
    'Read paper: Attention Is All You Need','Write unit tests for cart service','Laundry',
    'Prepare questions for mentor 1:1','Revise ER diagrams','Pay credit card bill','Organise Google Drive'];
  done_projects text[] := array['Personal','Internship','Internship','Coursework','Coursework','Personal','Personal',
    'Internship','Career','Internship','Personal','Coursework','Internship','Personal','Career','Coursework','Personal','Personal'];
  dsa_topics text[] := array['Dynamic programming','Graph traversal (BFS/DFS)','Segment trees','Greedy algorithms','Binary search on answers','Heaps & priority queues'];
  ml_topics text[] := array['Gradient descent','Regularisation','Decision trees','Neural network basics','Model evaluation metrics'];
  db_topics text[] := array['Normalisation (3NF, BCNF)','Transactions & ACID','Indexing strategies','SQL joins practice','Query optimisation'];
  jp_topics text[] := array['Kanji set 12','Listening practice','Grammar: て-form','Vocabulary review'];
  food text[] := array['Swiggy — dinner','Zomato — lunch','Café coffee','Canteen lunch','Chai & snacks'];
  transport text[] := array['Metro card top-up','Auto rickshaw','Uber to campus','Rapido bike'];
  shopping text[] := array['Amazon — notebooks','Decathlon — running socks','Myntra order','Stationery'];
  fun text[] := array['Movie — PVR','Board game café','Concert ticket'];
  health text[] := array['Pharmacy','Physio session','Protein powder'];
  idx int;
  ts timestamptz;
begin
  perform set_config('lifeos.seeding', 'on', true);

  -- ---------- Open tasks ----------
  insert into tasks (user_id, title, notes, status, priority, project, due_date, created_at) values
    (_uid, 'Submit DBMS assignment 4 — query optimisation', 'Cover index selection and EXPLAIN output for all six queries.', 'in_progress', 'urgent', 'Coursework', d, now() - interval '4 days'),
    (_uid, 'Fix flaky tests in payments service', 'Two tests fail intermittently on CI — likely a timezone issue.', 'todo', 'urgent', 'Internship', d - 1, now() - interval '3 days'),
    (_uid, 'Review pull request for onboarding flow', null, 'todo', 'high', 'Internship', d, now() - interval '1 day'),
    (_uid, 'Prepare slides for ML project review', '10 slides max. Include confusion matrix and next steps.', 'todo', 'high', 'Coursework', d + 1, now() - interval '2 days'),
    (_uid, 'Revise graph algorithms: Dijkstra, Bellman-Ford', null, 'todo', 'high', 'Coursework', d + 4, now() - interval '2 days'),
    (_uid, 'Pay electricity bill', null, 'todo', 'medium', 'Personal', d + 2, now() - interval '1 day'),
    (_uid, 'Read chapter 7: Normalisation', null, 'todo', 'medium', 'Coursework', d + 2, now() - interval '5 days'),
    (_uid, 'Write weekly internship update', null, 'todo', 'medium', 'Internship', d + 3, now() - interval '1 day'),
    (_uid, 'Draft cover letter for summer research programme', 'Tailor to the HCI lab at IISc.', 'in_progress', 'medium', 'Career', d + 8, now() - interval '6 days'),
    (_uid, 'Renew library books', null, 'todo', 'low', 'Personal', d + 1, now() - interval '3 days'),
    (_uid, 'Book dentist appointment', 'Ask about the wisdom tooth.', 'todo', 'low', 'Health', d + 6, now() - interval '2 days'),
    (_uid, 'Plan weekend trek with Rohan', null, 'todo', 'low', 'Personal', null, now() - interval '7 days');

  -- Done today
  insert into tasks (user_id, title, status, priority, project, due_date, completed_at, created_at) values
    (_uid, 'Write stand-up notes', 'done', 'medium', 'Internship', d, now() - interval '5 hours', now() - interval '1 day'),
    (_uid, 'Solve 2 DP problems', 'done', 'high', 'Coursework', d, now() - interval '3 hours', now() - interval '2 days'),
    (_uid, 'Morning run — 5 km', 'done', 'low', 'Health', d, now() - interval '7 hours', now() - interval '1 day');

  -- Completed history (past 4 weeks)
  for i in 1..27 loop
    for j in 1..(1 + floor(random() * 3))::int loop
      idx := 1 + floor(random() * array_length(done_titles, 1))::int;
      ts := ((d - i) + time '09:30' + random() * interval '10 hours')::timestamptz;
      insert into tasks (user_id, title, status, priority, project, due_date, completed_at, created_at)
      values (_uid, done_titles[idx], 'done',
        (array['high','medium','medium','low'])[1 + floor(random() * 4)::int],
        done_projects[idx], d - i, ts, ts - interval '2 days');
    end loop;
  end loop;

  -- ---------- Study ----------
  insert into study_subjects (user_id, name, color, weekly_goal_hours) values (_uid, 'Data Structures & Algorithms', 'indigo', 8) returning id into s_dsa;
  insert into study_subjects (user_id, name, color, weekly_goal_hours) values (_uid, 'Machine Learning', 'teal', 6) returning id into s_ml;
  insert into study_subjects (user_id, name, color, weekly_goal_hours) values (_uid, 'Database Systems', 'amber', 5) returning id into s_db;
  insert into study_subjects (user_id, name, color, weekly_goal_hours) values (_uid, 'Japanese (JLPT N4)', 'rose', 3) returning id into s_jp;

  for i in 1..55 loop
    day := d - i;
    if random() < 0.7 then
      insert into study_sessions (user_id, subject_id, topic, minutes, session_date)
      values (_uid, s_dsa, dsa_topics[1 + floor(random() * array_length(dsa_topics, 1))::int], (3 + floor(random() * 5))::int * 15, day);
    end if;
    if random() < 0.5 then
      insert into study_sessions (user_id, subject_id, topic, minutes, session_date)
      values (_uid, s_ml, ml_topics[1 + floor(random() * array_length(ml_topics, 1))::int], (3 + floor(random() * 4))::int * 15, day);
    end if;
    if random() < 0.45 then
      insert into study_sessions (user_id, subject_id, topic, minutes, session_date)
      values (_uid, s_db, db_topics[1 + floor(random() * array_length(db_topics, 1))::int], (2 + floor(random() * 4))::int * 15, day);
    end if;
    if random() < 0.3 then
      insert into study_sessions (user_id, subject_id, topic, minutes, session_date)
      values (_uid, s_jp, jp_topics[1 + floor(random() * array_length(jp_topics, 1))::int], (2 + floor(random() * 3))::int * 15, day);
    end if;
  end loop;
  insert into study_sessions (user_id, subject_id, topic, minutes, session_date) values
    (_uid, s_dsa, 'Dynamic programming — knapsack variants', 90, d),
    (_uid, s_db, 'Query optimisation', 60, d);

  insert into exams (user_id, subject_id, title, exam_date) values
    (_uid, s_db, 'DBMS mid-semester exam', d + 9),
    (_uid, s_ml, 'ML project viva', d + 16),
    (_uid, s_dsa, 'DSA end-semester exam', d + 30),
    (_uid, s_jp, 'JLPT N4 mock test', d + 45);

  -- ---------- Expenses (current + previous two months) ----------
  for m in 0..2 loop
    mstart := (date_trunc('month', d::timestamp) - make_interval(months => m))::date;
    mend := least((mstart + interval '1 month' - interval '1 day')::date, d);

    insert into expenses (user_id, title, amount, category, spent_on) values (_uid, 'Rent — ' || to_char(mstart, 'FMMonth'), 14000, 'Housing', mstart);
    if mstart + 4 <= mend then insert into expenses (user_id, title, amount, category, spent_on) values (_uid, 'Airtel broadband', 799, 'Utilities', mstart + 4); end if;
    if mstart + 7 <= mend then insert into expenses (user_id, title, amount, category, spent_on) values (_uid, 'Mobile recharge', 299, 'Utilities', mstart + 7); end if;
    if mstart + 11 <= mend then insert into expenses (user_id, title, amount, category, spent_on) values (_uid, 'Spotify Premium', 119, 'Subscriptions', mstart + 11); end if;
    if mstart + 14 <= mend then insert into expenses (user_id, title, amount, category, spent_on) values (_uid, 'Notion Plus', 400, 'Subscriptions', mstart + 14); end if;
    if mstart + 17 <= mend then insert into expenses (user_id, title, amount, category, spent_on) values (_uid, 'Electricity bill', round((1100 + random() * 600)::numeric, 0), 'Utilities', mstart + 17); end if;
    if m = 1 and mstart + 9 <= mend then insert into expenses (user_id, title, amount, category, spent_on) values (_uid, 'Udemy — System Design course', 549, 'Education', mstart + 9); end if;

    day := mstart;
    while day <= mend loop
      dow := extract(dow from day)::int;
      if dow = 0 then
        insert into expenses (user_id, title, amount, category, spent_on) values (_uid, 'Groceries — BigBasket', round((900 + random() * 1100)::numeric, 0), 'Groceries', day);
      end if;
      if random() < 0.3 then
        insert into expenses (user_id, title, amount, category, spent_on) values (_uid, food[1 + floor(random() * array_length(food, 1))::int], round((150 + random() * 500)::numeric, 0), 'Food & dining', day);
      end if;
      if random() < 0.4 then
        insert into expenses (user_id, title, amount, category, spent_on) values (_uid, transport[1 + floor(random() * array_length(transport, 1))::int], round((50 + random() * 250)::numeric, 0), 'Transport', day);
      end if;
      if random() < 0.06 then
        insert into expenses (user_id, title, amount, category, spent_on) values (_uid, shopping[1 + floor(random() * array_length(shopping, 1))::int], round((400 + random() * 2000)::numeric, 0), 'Shopping', day);
      end if;
      if random() < 0.05 then
        insert into expenses (user_id, title, amount, category, spent_on) values (_uid, fun[1 + floor(random() * array_length(fun, 1))::int], round((300 + random() * 700)::numeric, 0), 'Entertainment', day);
      end if;
      if random() < 0.03 then
        insert into expenses (user_id, title, amount, category, spent_on) values (_uid, health[1 + floor(random() * array_length(health, 1))::int], round((200 + random() * 1000)::numeric, 0), 'Health', day);
      end if;
      day := day + 1;
    end loop;
  end loop;

  -- ---------- Habits ----------
  insert into habits (user_id, name, color, target_per_week) values (_uid, 'Morning run', 'teal', 4) returning id into h_run;
  insert into habits (user_id, name, color, target_per_week) values (_uid, 'Read 20 pages', 'indigo', 7) returning id into h_read;
  insert into habits (user_id, name, color, target_per_week) values (_uid, 'Meditate 10 minutes', 'amber', 7) returning id into h_med;
  insert into habits (user_id, name, color, target_per_week) values (_uid, 'No phone after 11 pm', 'rose', 5) returning id into h_phone;
  insert into habits (user_id, name, color, target_per_week) values (_uid, 'Drink 2 L water', 'sky', 7) returning id into h_water;

  for i in 1..83 loop
    day := d - i;
    if extract(isodow from day) in (1, 3, 5, 6) and (random() < 0.75 or i <= 3) then
      insert into habit_logs (user_id, habit_id, log_date) values (_uid, h_run, day);
    end if;
    if random() < 0.8 or i <= 9 then insert into habit_logs (user_id, habit_id, log_date) values (_uid, h_read, day); end if;
    if random() < 0.65 then insert into habit_logs (user_id, habit_id, log_date) values (_uid, h_med, day); end if;
    if random() < 0.55 then insert into habit_logs (user_id, habit_id, log_date) values (_uid, h_phone, day); end if;
    if random() < 0.88 or i <= 14 then insert into habit_logs (user_id, habit_id, log_date) values (_uid, h_water, day); end if;
  end loop;
  insert into habit_logs (user_id, habit_id, log_date) values (_uid, h_read, d), (_uid, h_water, d), (_uid, h_run, d);

  -- ---------- Calendar ----------
  day := d - 10;
  while day <= d + 28 loop
    dow := extract(isodow from day)::int;
    if dow between 1 and 5 then
      insert into events (user_id, title, event_date, start_time, end_time, category, location) values (_uid, 'Daily stand-up', day, '09:30', '09:45', 'work', 'Google Meet');
    end if;
    if dow in (1, 3) then
      insert into events (user_id, title, event_date, start_time, end_time, category, location) values (_uid, 'Lecture: Database Systems', day, '11:00', '12:30', 'study', 'Room 204, CS Block');
    end if;
    if dow in (2, 4) then
      insert into events (user_id, title, event_date, start_time, end_time, category, location) values
        (_uid, 'Lecture: Machine Learning', day, '11:00', '12:30', 'study', 'Lecture Hall 3'),
        (_uid, 'Algorithms lab', day, '15:00', '17:00', 'study', 'Lab 2');
    end if;
    if dow in (1, 3, 5) then
      insert into events (user_id, title, event_date, start_time, end_time, category, location) values (_uid, 'Internship — deep work', day, '14:00', '17:00', 'work', 'Remote');
    end if;
    if dow in (2, 4, 6) then
      insert into events (user_id, title, event_date, start_time, end_time, category, location) values (_uid, 'Gym', day, '07:00', '08:00', 'health', 'Campus gym');
    end if;
    if dow = 6 then
      insert into events (user_id, title, event_date, start_time, end_time, category, location) values (_uid, 'DSA study group', day, '10:00', '12:00', 'study', 'Library, 2nd floor');
    end if;
    if dow = 7 then
      insert into events (user_id, title, event_date, start_time, end_time, category, location) values (_uid, 'Weekly review', day, '19:00', '19:30', 'personal', null);
    end if;
    day := day + 1;
  end loop;
  insert into events (user_id, title, event_date, start_time, end_time, category, location) values
    (_uid, '1:1 with mentor', d, '12:45', '13:15', 'work', 'Google Meet'),
    (_uid, 'Focus block: DBMS assignment', d, '19:00', '21:00', 'study', 'Home'),
    (_uid, 'ML project review with Prof. Iyer', d + 1, '16:00', '16:45', 'study', 'Faculty office 3.12'),
    (_uid, 'Dinner with Ananya', d + 3, '20:00', '22:00', 'personal', 'Toit, Indiranagar'),
    (_uid, 'Dentist', d + 6, '10:30', '11:00', 'health', 'Smile Dental Clinic'),
    (_uid, 'DBMS mid-semester exam', d + 9, '10:00', '13:00', 'study', 'Exam Hall A');

  -- ---------- Activity ----------
  insert into activity (user_id, kind, title, meta, created_at) values
    (_uid, 'habit_checked', 'Read 20 pages', '{}'::jsonb, now() - interval '40 minutes'),
    (_uid, 'study_logged', 'Dynamic programming — knapsack variants', jsonb_build_object('minutes', 90, 'subject', 'Data Structures & Algorithms'), now() - interval '2 hours'),
    (_uid, 'task_completed', 'Solve 2 DP problems', jsonb_build_object('project', 'Coursework'), now() - interval '3 hours'),
    (_uid, 'expense_added', 'Canteen lunch', jsonb_build_object('amount', 180, 'category', 'Food & dining'), now() - interval '4 hours'),
    (_uid, 'task_completed', 'Write stand-up notes', jsonb_build_object('project', 'Internship'), now() - interval '5 hours'),
    (_uid, 'task_created', 'Prepare slides for ML project review', jsonb_build_object('priority', 'high'), now() - interval '1 day'),
    (_uid, 'event_created', 'ML project review with Prof. Iyer', jsonb_build_object('date', d + 1), now() - interval '1 day 2 hours');

  perform set_config('lifeos.seeding', 'off', true);
end;
$$;

revoke all on function public.seed_sample_data(uuid, date) from public, anon, authenticated;
revoke all on function public.wipe_user_data(uuid) from public, anon, authenticated;

create or replace function public.load_sample_data(_today date)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  if _today is null or abs(_today - current_date) > 2 then raise exception 'Invalid date'; end if;
  perform public.wipe_user_data(v_uid);
  perform public.seed_sample_data(v_uid, _today);
  update profiles set onboarded_at = coalesce(onboarded_at, now()) where id = v_uid;
end;
$$;

create or replace function public.clear_my_data()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  perform public.wipe_user_data(v_uid);
  update profiles set onboarded_at = coalesce(onboarded_at, now()) where id = v_uid;
end;
$$;

revoke all on function public.load_sample_data(date) from public, anon;
revoke all on function public.clear_my_data() from public, anon;
grant execute on function public.load_sample_data(date) to authenticated;
grant execute on function public.clear_my_data() to authenticated;
