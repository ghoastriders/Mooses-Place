-- Seed initial games for Mooses Place
-- National: Powerball, Mega Millions
-- Alaska: charitable draw trackers (templates)

insert into public.games (key, name, region, game_type, rules)
values
  (
    'powerball',
    'Powerball',
    'US (multi-state)',
    'national',
    jsonb_build_object(
      'main_count', 5,
      'main_min', 1,
      'main_max', 69,
      'bonus_count', 1,
      'bonus_min', 1,
      'bonus_max', 26,
      'notes', 'Powerball analysis only; Mooses Place does not sell tickets.'
    )
  ),
  (
    'megamillions',
    'Mega Millions',
    'US (multi-state)',
    'national',
    jsonb_build_object(
      'main_count', 5,
      'main_min', 1,
      'main_max', 70,
      'bonus_count', 1,
      'bonus_min', 1,
      'bonus_max', 25,
      'notes', 'Mega Millions analysis only; Mooses Place does not sell tickets.'
    )
  ),
  (
    'ak_charitable_raffle',
    'Alaska Charitable Raffle (Template)',
    'Alaska',
    'ak_charitable',
    jsonb_build_object(
      'format', 'raffle',
      'notes', 'Template for organizer-published raffle results; custom formats vary by organizer.'
    )
  ),
  (
    'ak_charitable_chase_the_ace',
    'Alaska Chase the Ace (Template)',
    'Alaska',
    'ak_charitable',
    jsonb_build_object(
      'format', 'chase_the_ace',
      'notes', 'Template for Chase-the-Ace style weekly draws; custom formats vary by organizer.'
    )
  )
on conflict (key) do nothing;
