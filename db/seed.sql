insert into agencies (id, name, language_default, plan)
values ('agency_demo_001', 'FanMind Demo Agency', 'de', 'FanMind Growth')
on conflict (id) do update set
  name = excluded.name,
  language_default = excluded.language_default,
  plan = excluded.plan;

insert into users (id, agency_id, email, name, role)
values ('user_demo_gerhard', 'agency_demo_001', 'demo@fanmind.ch', 'Gerhard Demo', 'agency_admin')
on conflict (id) do update set
  email = excluded.email,
  name = excluded.name,
  role = excluded.role;

insert into creators (id, agency_id, display_name, platform, language, tone, persona_notes, boundaries)
values
  ('creator_mia_active', 'agency_demo_001', 'Mia Active Club', 'manual_demo', 'de', 'motivierend, warm, direkt', 'Fitness-Coach mit Fokus auf Motivation, Routinen und persoenliche Challenges.', 'Nicht zu aggressiv verkaufen. Keine medizinischen Versprechen. Keine automatischen Nachrichten.'),
  ('creator_dj_nova', 'agency_demo_001', 'DJ Nova', 'manual_demo', 'en', 'energetic, friendly, confident', 'DJ profile with fan conversations around events, VIP requests and music releases.', 'No false event promises. No automated sending. Keep replies short and personal.'),
  ('creator_team_arena', 'agency_demo_001', 'Team Arena', 'manual_demo', 'de', 'professionell, sportlich, nahbar', 'Sportnahes Profil fuer Fanbindung, Events, Ticketinteresse und Community-Aktionen.', 'Keine falschen Ticketzusagen. Keine aggressiven Sales-Nachrichten.')
on conflict (id) do update set
  display_name = excluded.display_name,
  platform = excluded.platform,
  language = excluded.language,
  tone = excluded.tone,
  persona_notes = excluded.persona_notes,
  boundaries = excluded.boundaries;

insert into fans (id, agency_id, creator_id, handle, display_name, status, language, summary, tags, value_level)
values
  ('fan_lukas_01', 'agency_demo_001', 'creator_mia_active', 'lukas_fit23', 'Lukas', 'warm', 'de', 'Interessiert an Trainingsplaenen und reagiert gut auf persoenliche Motivation.', array['fitness','challenge','warm'], 'medium'),
  ('fan_sandra_02', 'agency_demo_001', 'creator_mia_active', 'sandra_moves', 'Sandra', 'buyer', 'de', 'Hat bereits ein Challenge-Paket gekauft und fragt nach Premium-Begleitung.', array['buyer','premium_interest'], 'high'),
  ('fan_mario_03', 'agency_demo_001', 'creator_mia_active', 'mario_startet', 'Mario', 'new', 'de', 'Neuer Kontakt, fragt nach Einstieg und Aufwand pro Woche.', array['new','beginner'], 'low'),
  ('fan_alex_04', 'agency_demo_001', 'creator_dj_nova', 'alex_vip', 'Alex', 'vip', 'en', 'Interested in VIP access and early event information.', array['vip','event_interest'], 'high'),
  ('fan_nina_05', 'agency_demo_001', 'creator_dj_nova', 'nina_dance', 'Nina', 'warm', 'en', 'Often reacts to music snippets and asks about new releases.', array['music','warm'], 'medium'),
  ('fan_tom_06', 'agency_demo_001', 'creator_team_arena', 'tom_fanclub', 'Tom', 'warm', 'de', 'Fragt nach Fanclub-Aktionen und moechte Freunde zu einem Event mitnehmen.', array['event','group_interest'], 'medium'),
  ('fan_ella_07', 'agency_demo_001', 'creator_team_arena', 'ella_supports', 'Ella', 'inactive', 'de', 'War frueher sehr aktiv, hat seit mehreren Wochen nicht mehr reagiert.', array['inactive','reactivation'], 'medium'),
  ('fan_rene_08', 'agency_demo_001', 'creator_team_arena', 'rene1908', 'Rene', 'do_not_push', 'de', 'Reagiert negativ auf Verkaufsdruck, bevorzugt sachliche kurze Antworten.', array['careful','do_not_push'], 'low')
on conflict (id) do update set
  handle = excluded.handle,
  display_name = excluded.display_name,
  status = excluded.status,
  language = excluded.language,
  summary = excluded.summary,
  tags = excluded.tags,
  value_level = excluded.value_level;

insert into messages (id, agency_id, creator_id, fan_id, direction, content, source, created_by)
values
  ('msg_001', 'agency_demo_001', 'creator_mia_active', 'fan_lukas_01', 'inbound', 'Ich wuerde gern starten, aber ich weiss nicht, ob ich das zeitlich schaffe.', 'manual_demo', 'user_demo_gerhard'),
  ('msg_002', 'agency_demo_001', 'creator_mia_active', 'fan_sandra_02', 'inbound', 'Die Challenge war super. Gibt es etwas Persoenlicheres fuer mich?', 'manual_demo', 'user_demo_gerhard'),
  ('msg_003', 'agency_demo_001', 'creator_dj_nova', 'fan_alex_04', 'inbound', 'Can I get early access to the next VIP event?', 'manual_demo', 'user_demo_gerhard')
on conflict (id) do update set
  content = excluded.content,
  source = excluded.source;

insert into memories (id, agency_id, creator_id, fan_id, memory_type, content, importance, created_by)
values
  ('memory_001', 'agency_demo_001', 'creator_mia_active', 'fan_lukas_01', 'preference', 'Lukas mag kurze, motivierende Antworten und moechte realistische Wochenziele.', 'medium', 'user_demo_gerhard'),
  ('memory_002', 'agency_demo_001', 'creator_mia_active', 'fan_sandra_02', 'purchase_signal', 'Sandra hat Interesse an Premium-Begleitung nach erfolgreicher Challenge.', 'high', 'user_demo_gerhard'),
  ('memory_003', 'agency_demo_001', 'creator_team_arena', 'fan_rene_08', 'boundary', 'Rene nicht draengen. Kurz, sachlich und ohne Verkaufsdruck antworten.', 'high', 'user_demo_gerhard')
on conflict (id) do update set
  memory_type = excluded.memory_type,
  content = excluded.content,
  importance = excluded.importance;

insert into followups (id, agency_id, creator_id, fan_id, due_date, due_label, reason, priority, status, created_by)
values
  ('followup_001', 'agency_demo_001', 'creator_mia_active', 'fan_lukas_01', current_date, 'Heute', 'Nachfragen, ob ein 3-Tage-Einstieg fuer ihn machbar waere.', 'medium', 'open', 'user_demo_gerhard'),
  ('followup_002', 'agency_demo_001', 'creator_mia_active', 'fan_sandra_02', current_date + 3, 'Diese Woche', 'Premium-Angebot mit persoenlicher Begleitung vorsichtig vorstellen.', 'high', 'open', 'user_demo_gerhard'),
  ('followup_003', 'agency_demo_001', 'creator_dj_nova', 'fan_alex_04', current_date, 'Heute', 'VIP-Interesse beantworten und Warteliste anbieten.', 'high', 'open', 'user_demo_gerhard'),
  ('followup_004', 'agency_demo_001', 'creator_team_arena', 'fan_ella_07', current_date - 1, 'Ueberfaellig', 'Reaktivierung mit freundlichem Update versuchen.', 'medium', 'open', 'user_demo_gerhard'),
  ('followup_005', 'agency_demo_001', 'creator_team_arena', 'fan_rene_08', current_date + 4, 'Diese Woche', 'Nur sachlich informieren, kein Sales-Druck.', 'low', 'open', 'user_demo_gerhard')
on conflict (id) do update set
  due_date = excluded.due_date,
  due_label = excluded.due_label,
  reason = excluded.reason,
  priority = excluded.priority,
  status = excluded.status;
