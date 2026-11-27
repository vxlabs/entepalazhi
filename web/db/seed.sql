-- SAMPLE DATA for local development only (node scripts/migrate.mjs --seed).
-- Every row below is invented and labelled "[Sample]". None of it is real
-- reporting about Palazhi. Never load this into the production database.

insert into projects (
  slug, name_en, name_ml, description_en, description_ml,
  area, local_body, local_body_type, latitude, longitude,
  cost_inr, cost_note, tenure, inaugurated_on, promised_completion_on, department,
  status, source, submitted_on, reported_on, resolved_on, is_published
) values
(
  'sample-junction-road-resurfacing',
  '[Sample] Junction road resurfacing', '[മാതൃക] ജംഗ്ഷൻ റോഡ് റീടാറിംഗ്',
  'Sample entry. A stretch of road sanctioned for resurfacing where work has not started.',
  'മാതൃകാ വിവരം. റീടാറിംഗിന് അനുമതി ലഭിച്ചിട്ടും പണി തുടങ്ങാത്ത റോഡ് ഭാഗം.',
  'palazhi-junction', 'Olavanna Grama Panchayat', 'panchayat', 11.2452, 75.8338,
  2400000, 'sanctioned', null, '2025-02-14', '2025-08-31', 'Panchayat Engineering',
  'reported', 'admin', '2025-09-10', '2025-09-10', null, 1
),
(
  'sample-business-park-drain',
  '[Sample] Roadside drain near the business park', '[മാതൃക] ബിസിനസ് പാർക്കിനടുത്തുള്ള ഓട',
  'Sample entry. A roadside drain that overflows in the monsoon; desilting resumed after it was reported.',
  'മാതൃകാ വിവരം. മഴക്കാലത്ത് കവിഞ്ഞൊഴുകുന്ന റോഡരികിലെ ഓട; റിപ്പോർട്ടിന് ശേഷം ചെളി നീക്കൽ പുനരാരംഭിച്ചു.',
  'hilite', 'Olavanna Grama Panchayat', 'panchayat', 11.2478, 75.8365,
  850000, 'revised_estimate', null, '2024-11-01', '2025-03-31', 'Panchayat Engineering',
  'work_resumed', 'admin', '2025-06-20', '2025-06-20', null, 1
),
(
  'sample-streetlights-mathara-road',
  '[Sample] Streetlights on Mathara road', '[മാതൃക] മാത്തറ റോഡിലെ തെരുവുവിളക്കുകൾ',
  'Sample entry. Twelve streetlights that were out of service and have since been repaired.',
  'മാതൃകാ വിവരം. പ്രവർത്തനരഹിതമായിരുന്ന പന്ത്രണ്ട് തെരുവുവിളക്കുകൾ പിന്നീട് നന്നാക്കി.',
  'mathara', 'Olavanna Grama Panchayat', 'panchayat', 11.2405, 75.8290,
  null, null, null, null, null, 'KSEB',
  'completed', 'admin', '2025-01-15', '2025-01-15', '2025-04-02', 1
),
(
  'sample-waterlogging-report',
  '[Sample] Waterlogging near the bus stop', null,
  'Sample entry. A report sent in by a resident, waiting for review. Used to check that unreviewed reports stay off the public site.',
  null,
  'kunnathupalam', 'Olavanna Grama Panchayat', null, null, null,
  null, null, null, null, null, null,
  'lead', 'public', '2026-10-30', null, null, 0
);

insert into project_updates (project_id, happened_on, title_en, title_ml, body_en, body_ml, status_after)
select id, '2025-07-05', '[Sample] Desilting restarted', '[മാതൃക] ചെളി നീക്കൽ പുനരാരംഭിച്ചു',
  'Sample entry. Workers and a machine were seen on site.',
  'മാതൃകാ വിവരം. തൊഴിലാളികളെയും യന്ത്രവും സ്ഥലത്ത് കണ്ടു.',
  'work_resumed'
from projects where slug = 'sample-business-park-drain';

insert into project_updates (project_id, happened_on, title_en, title_ml, body_en, body_ml, status_after)
select id, '2025-04-02', '[Sample] All twelve lights working', '[മാതൃക] പന്ത്രണ്ട് വിളക്കുകളും പ്രവർത്തിക്കുന്നു',
  'Sample entry. Checked after dark; every light on the stretch was lit.',
  'മാതൃകാ വിവരം. രാത്രി പരിശോധിച്ചപ്പോൾ എല്ലാ വിളക്കുകളും തെളിഞ്ഞിരുന്നു.',
  'completed'
from projects where slug = 'sample-streetlights-mathara-road';

insert into project_submitters (project_id, name, phone, note)
select id, 'Sample Resident', '0000000000', 'Sample contact row.'
from projects where slug = 'sample-waterlogging-report';
