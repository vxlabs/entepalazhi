-- Sample data for local development and the Phase 1 exit-criteria checks.
-- Names/details below are illustrative placeholders, not real reporting -
-- swap for real projects once he starts publishing from /admin (Phase 2).
--
-- Deliberately no project_media rows: without real uploaded photos, seeded
-- storage_path values would just be broken image links. The gallery
-- section only renders when media.length > 0, so this is safe to leave
-- empty until Phase 2's upload path exists.

insert into public.projects (
  slug, name_en, name_ml, description_en, description_ml,
  district, local_body, local_body_type, latitude, longitude,
  cost_inr, cost_note, tenure, inaugurated_on, promised_completion_on, department,
  status, source, submitted_on, reported_on, resolved_on,
  instagram_url, youtube_url, seen_count, is_published
) values
(
  'kozhikode-riverside-bridge',
  'Riverside Connector Bridge', 'നദീതീര കണക്ടർ പാലം',
  'A pedestrian and light-vehicle bridge inaugurated to connect two panchayats across the river. Construction stopped after the foundation and half the piers were completed.',
  'നദിക്ക് കുറുകെ രണ്ട് പഞ്ചായത്തുകളെ ബന്ധിപ്പിക്കാൻ ഉദ്ഘാടനം ചെയ്ത ഒരു കാൽനട, ചെറുവാഹന പാലം. അടിത്തറയും പകുതി തൂണുകളും പൂർത്തിയായ ശേഷം നിർമ്മാണം നിലച്ചു.',
  'kozhikode', 'Feroke Municipality', 'municipality', 11.1470, 75.7797,
  38500000, 'sanctioned', 'LDF 2016-2021', '2018-08-15', '2020-03-31', 'PWD (Roads & Bridges)',
  'reported', 'creator', '2025-11-02', '2025-11-02', null,
  'https://www.instagram.com/mallu_boys88/', 'https://www.youtube.com/@mallu_boys88',
  0, true
),
(
  'ernakulam-taluk-hospital-block',
  'Taluk Hospital New Block', 'താലൂക്ക് ആശുപത്രി പുതിയ ബ്ലോക്ക്',
  'A new inpatient block sanctioned to add 80 beds to the taluk hospital. Structural work resumed after being reported, following a district administration review.',
  'താലൂക്ക് ആശുപത്രിയിൽ 80 കിടക്കകൾ കൂട്ടിച്ചേർക്കാൻ അനുവദിച്ച പുതിയ ഇൻപേഷ്യന്റ് ബ്ലോക്ക്. റിപ്പോർട്ട് ചെയ്തതിനെത്തുടർന്ന് ജില്ലാ ഭരണകൂടത്തിന്റെ അവലോകനത്തിന് ശേഷം നിർമ്മാണ പ്രവർത്തനങ്ങൾ പുനരാരംഭിച്ചു.',
  'ernakulam', 'Aluva Municipality', 'municipality', 10.1075, 76.3516,
  92000000, 'revised_estimate', 'UDF 2011-2016, LDF 2016-2021', '2015-06-01', '2017-12-31', 'Health & Family Welfare',
  'work_resumed', 'creator', '2025-06-18', '2025-06-18', null,
  'https://www.instagram.com/mallu_boys88/', 'https://www.youtube.com/@mallu_boys88',
  0, true
),
(
  'thrissur-bypass-widening',
  'Town Bypass Road Widening', 'ടൗൺ ബൈപാസ് റോഡ് വീതി കൂട്ടൽ',
  'Widening of a 4km bypass stretch that had been left half-completed for over three years. Work finished roughly a year after this was first reported.',
  'മൂന്ന് വർഷത്തിലധികമായി പകുതി പൂർത്തിയാകാതെ കിടന്ന 4 കിലോമീറ്റർ ബൈപാസ് ഭാഗത്തിന്റെ വീതി കൂട്ടൽ. ഇത് ആദ്യം റിപ്പോർട്ട് ചെയ്തതിന് ഏകദേശം ഒരു വർഷത്തിന് ശേഷം ജോലി പൂർത്തിയായി.',
  'thrissur', 'Thrissur Corporation', 'corporation', 10.5276, 76.2144,
  154000000, 'sanctioned', 'UDF 2011-2016', '2014-01-20', '2016-06-30', 'PWD (Roads & Bridges)',
  'completed', 'creator', '2023-09-01', '2023-09-01', '2024-10-14',
  'https://www.instagram.com/mallu_boys88/', 'https://www.youtube.com/@mallu_boys88',
  0, true
),
(
  'wayanad-irrigation-canal',
  'Minor Irrigation Canal Extension', 'ചെറുകിട ജലസേചന കനാൽ വിപുലീകരണം',
  'A tip flagged by a local farmer collective about an irrigation canal extension that stopped roughly 400 metres short of the fields it was meant to serve. Not yet filmed.',
  'സേവിക്കാൻ ഉദ്ദേശിച്ച വയലുകളിൽ നിന്ന് ഏകദേശം 400 മീറ്റർ അകലെ നിലച്ചുപോയ ഒരു ജലസേചന കനാൽ വിപുലീകരണത്തെക്കുറിച്ച് ഒരു പ്രാദേശിക കർഷക കൂട്ടായ്മ ചൂണ്ടിക്കാട്ടിയ വിവരം. ഇതുവരെ ചിത്രീകരിച്ചിട്ടില്ല.',
  'wayanad', 'Mananthavady Municipality', 'municipality', 11.7960, 76.0060,
  6200000, 'sanctioned', 'LDF 2021-present', '2022-02-10', null, 'Irrigation',
  'lead', 'public', '2026-05-20', null, null,
  null, null, 0, true
),
(
  'kollam-market-complex',
  'Municipal Market Complex', 'മുനിസിപ്പൽ മാർക്കറ്റ് കോംപ്ലക്സ്',
  'A public submission awaiting review before publication - used to verify the moderation queue keeps unpublished rows off the public site.',
  'പ്രസിദ്ധീകരണത്തിന് മുമ്പ് അവലോകനം കാത്തിരിക്കുന്ന ഒരു പൊതു സമർപ്പണം.',
  'kollam', 'Kollam Corporation', 'corporation', null, null,
  null, null, null, null, null, null,
  'lead', 'public', '2026-08-30', null, null,
  null, null, 0, false
);

insert into public.project_updates (project_id, happened_on, title_en, title_ml, body_en, body_ml, status_after, source_url)
select id, '2025-11-10', 'District office confirms site visit', 'ജില്ലാ ഓഫീസ് സ്ഥലം സന്ദർശനം സ്ഥിരീകരിച്ചു',
  'The district PWD office confirmed a site inspection following the report, but no revised timeline has been shared yet.',
  'റിപ്പോർട്ടിനെത്തുടർന്ന് ജില്ലാ PWD ഓഫീസ് സ്ഥലപരിശോധന സ്ഥിരീകരിച്ചു, എന്നാൽ പുതുക്കിയ സമയക്രമം ഇതുവരെ പങ്കിട്ടിട്ടില്ല.',
  'acknowledged', null
from public.projects where slug = 'kozhikode-riverside-bridge';

insert into public.project_updates (project_id, happened_on, title_en, title_ml, body_en, body_ml, status_after, source_url)
select id, '2025-07-02', 'Contractor remobilised', 'കരാറുകാരൻ വീണ്ടും വിന്യസിച്ചു',
  'The original contractor remobilised equipment on site after the district administration review.',
  'ജില്ലാ ഭരണകൂടത്തിന്റെ അവലോകനത്തിന് ശേഷം യഥാർത്ഥ കരാറുകാരൻ സ്ഥലത്ത് ഉപകരണങ്ങൾ വീണ്ടും വിന്യസിച്ചു.',
  'work_resumed', null
from public.projects where slug = 'ernakulam-taluk-hospital-block';

insert into public.project_updates (project_id, happened_on, title_en, title_ml, body_en, body_ml, status_after, source_url)
select id, '2024-10-14', 'Widening completed and opened to traffic', 'വീതി കൂട്ടൽ പൂർത്തിയാക്കി ഗതാഗതത്തിനായി തുറന്നു',
  'The widened stretch was inaugurated and opened to traffic, roughly 13 months after this was first reported.',
  'ഇത് ആദ്യം റിപ്പോർട്ട് ചെയ്തതിന് ഏകദേശം 13 മാസത്തിന് ശേഷം വീതി കൂട്ടിയ ഭാഗം ഉദ്ഘാടനം ചെയ്ത് ഗതാഗതത്തിനായി തുറന്നു.',
  'completed', null
from public.projects where slug = 'thrissur-bypass-widening';
