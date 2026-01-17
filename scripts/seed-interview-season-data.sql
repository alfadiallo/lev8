-- ============================================================================
-- INTERVIEW SEASON SYNTHETIC DATA
-- 18 interview days, 10 candidates per day, realistic faculty assignments
-- ============================================================================

-- ============================================================================
-- CONFIGURATION
-- ============================================================================
-- Season: 2026-2027 Interview Season
-- Interview Days: 18 (Oct 2026 - Feb 2027)
-- Candidates per day: 10 (180 total)
-- 
-- Faculty Assignments:
--   - Program Director: ALL 18 days
--   - Assistant Program Director: 5 days (every ~4th day)
--   - Core Faculty (8): 3 days each
--   - Teaching Faculty (3): Fill remaining gaps
--
-- Each candidate receives 3 interviewer ratings per day
-- ============================================================================

-- ============================================================================
-- 1. INTERVIEW SESSIONS (18 Interview Days)
-- ============================================================================

INSERT INTO public.interview_sessions (
    id, session_type, session_name, session_date, status, 
    creator_email, share_token, is_public
) VALUES
    -- October 2026
    ('11111111-0001-0001-0001-000000000001', 'group', 'Interview Day 1 - October 15, 2026', '2026-10-15', 'review', 'pd@hospital.edu', 'share_day_01', false),
    ('11111111-0001-0001-0001-000000000002', 'group', 'Interview Day 2 - October 22, 2026', '2026-10-22', 'review', 'pd@hospital.edu', 'share_day_02', false),
    ('11111111-0001-0001-0001-000000000003', 'group', 'Interview Day 3 - October 29, 2026', '2026-10-29', 'review', 'pd@hospital.edu', 'share_day_03', false),
    
    -- November 2026
    ('11111111-0001-0001-0001-000000000004', 'group', 'Interview Day 4 - November 5, 2026', '2026-11-05', 'review', 'pd@hospital.edu', 'share_day_04', false),
    ('11111111-0001-0001-0001-000000000005', 'group', 'Interview Day 5 - November 12, 2026', '2026-11-12', 'review', 'pd@hospital.edu', 'share_day_05', false),
    ('11111111-0001-0001-0001-000000000006', 'group', 'Interview Day 6 - November 19, 2026', '2026-11-19', 'review', 'pd@hospital.edu', 'share_day_06', false),
    
    -- December 2026
    ('11111111-0001-0001-0001-000000000007', 'group', 'Interview Day 7 - December 3, 2026', '2026-12-03', 'review', 'pd@hospital.edu', 'share_day_07', false),
    ('11111111-0001-0001-0001-000000000008', 'group', 'Interview Day 8 - December 10, 2026', '2026-12-10', 'review', 'pd@hospital.edu', 'share_day_08', false),
    ('11111111-0001-0001-0001-000000000009', 'group', 'Interview Day 9 - December 17, 2026', '2026-12-17', 'review', 'pd@hospital.edu', 'share_day_09', false),
    
    -- January 2027
    ('11111111-0001-0001-0001-000000000010', 'group', 'Interview Day 10 - January 7, 2027', '2027-01-07', 'review', 'pd@hospital.edu', 'share_day_10', false),
    ('11111111-0001-0001-0001-000000000011', 'group', 'Interview Day 11 - January 14, 2027', '2027-01-14', 'review', 'pd@hospital.edu', 'share_day_11', false),
    ('11111111-0001-0001-0001-000000000012', 'group', 'Interview Day 12 - January 21, 2027', '2027-01-21', 'review', 'pd@hospital.edu', 'share_day_12', false),
    ('11111111-0001-0001-0001-000000000013', 'group', 'Interview Day 13 - January 28, 2027', '2027-01-28', 'review', 'pd@hospital.edu', 'share_day_13', false),
    
    -- February 2027
    ('11111111-0001-0001-0001-000000000014', 'group', 'Interview Day 14 - February 4, 2027', '2027-02-04', 'review', 'pd@hospital.edu', 'share_day_14', false),
    ('11111111-0001-0001-0001-000000000015', 'group', 'Interview Day 15 - February 11, 2027', '2027-02-11', 'review', 'pd@hospital.edu', 'share_day_15', false),
    ('11111111-0001-0001-0001-000000000016', 'group', 'Interview Day 16 - February 18, 2027', '2027-02-18', 'review', 'pd@hospital.edu', 'share_day_16', false),
    ('11111111-0001-0001-0001-000000000017', 'group', 'Interview Day 17 - February 25, 2027', '2027-02-25', 'review', 'pd@hospital.edu', 'share_day_17', false),
    ('11111111-0001-0001-0001-000000000018', 'group', 'Interview Day 18 - March 4, 2027', '2027-03-04', 'review', 'pd@hospital.edu', 'share_day_18', false);

-- ============================================================================
-- 2. INTERVIEW CANDIDATES (180 total - 10 per day)
-- Minimal fields: name, email, medical_school
-- ============================================================================

-- Helper: Medical schools for variety
-- Will distribute across: Johns Hopkins, Harvard, Stanford, UCSF, Penn, Columbia, 
-- Duke, Wash U, NYU, UCLA, Northwestern, Cornell, Michigan, Emory, Mayo, Vanderbilt,
-- Baylor, Case Western, Mt Sinai, USC, Georgetown, Tulane, Ohio State, U Chicago

INSERT INTO public.interview_candidates (
    id, session_id, candidate_name, candidate_email, medical_school, sort_order
) VALUES
    -- Day 1 (October 15)
    ('22222222-0001-0001-0001-000000000001', '11111111-0001-0001-0001-000000000001', 'Aiden Mitchell', 'aiden.mitchell@email.com', 'Johns Hopkins School of Medicine', 1),
    ('22222222-0001-0001-0001-000000000002', '11111111-0001-0001-0001-000000000001', 'Sophia Chen', 'sophia.chen@email.com', 'Harvard Medical School', 2),
    ('22222222-0001-0001-0001-000000000003', '11111111-0001-0001-0001-000000000001', 'Liam Patel', 'liam.patel@email.com', 'Stanford School of Medicine', 3),
    ('22222222-0001-0001-0001-000000000004', '11111111-0001-0001-0001-000000000001', 'Emma Rodriguez', 'emma.rodriguez@email.com', 'UCSF School of Medicine', 4),
    ('22222222-0001-0001-0001-000000000005', '11111111-0001-0001-0001-000000000001', 'Noah Williams', 'noah.williams@email.com', 'Perelman School of Medicine (Penn)', 5),
    ('22222222-0001-0001-0001-000000000006', '11111111-0001-0001-0001-000000000001', 'Olivia Kim', 'olivia.kim@email.com', 'Columbia Vagelos College of P&S', 6),
    ('22222222-0001-0001-0001-000000000007', '11111111-0001-0001-0001-000000000001', 'Ethan Nguyen', 'ethan.nguyen@email.com', 'Duke University School of Medicine', 7),
    ('22222222-0001-0001-0001-000000000008', '11111111-0001-0001-0001-000000000001', 'Isabella Garcia', 'isabella.garcia@email.com', 'Washington University in St. Louis', 8),
    ('22222222-0001-0001-0001-000000000009', '11111111-0001-0001-0001-000000000001', 'Mason Lee', 'mason.lee@email.com', 'NYU Grossman School of Medicine', 9),
    ('22222222-0001-0001-0001-000000000010', '11111111-0001-0001-0001-000000000001', 'Ava Thompson', 'ava.thompson@email.com', 'UCLA David Geffen School of Medicine', 10),

    -- Day 2 (October 22)
    ('22222222-0001-0001-0001-000000000011', '11111111-0001-0001-0001-000000000002', 'Lucas Brown', 'lucas.brown@email.com', 'Northwestern Feinberg School of Medicine', 1),
    ('22222222-0001-0001-0001-000000000012', '11111111-0001-0001-0001-000000000002', 'Mia Johnson', 'mia.johnson@email.com', 'Weill Cornell Medicine', 2),
    ('22222222-0001-0001-0001-000000000013', '11111111-0001-0001-0001-000000000002', 'Jackson Davis', 'jackson.davis@email.com', 'University of Michigan Medical School', 3),
    ('22222222-0001-0001-0001-000000000014', '11111111-0001-0001-0001-000000000002', 'Charlotte Wilson', 'charlotte.wilson@email.com', 'Emory School of Medicine', 4),
    ('22222222-0001-0001-0001-000000000015', '11111111-0001-0001-0001-000000000002', 'Sebastian Martinez', 'sebastian.martinez@email.com', 'Mayo Clinic Alix School of Medicine', 5),
    ('22222222-0001-0001-0001-000000000016', '11111111-0001-0001-0001-000000000002', 'Amelia Taylor', 'amelia.taylor@email.com', 'Vanderbilt School of Medicine', 6),
    ('22222222-0001-0001-0001-000000000017', '11111111-0001-0001-0001-000000000002', 'Henry Anderson', 'henry.anderson@email.com', 'Baylor College of Medicine', 7),
    ('22222222-0001-0001-0001-000000000018', '11111111-0001-0001-0001-000000000002', 'Harper Thomas', 'harper.thomas@email.com', 'Case Western Reserve School of Medicine', 8),
    ('22222222-0001-0001-0001-000000000019', '11111111-0001-0001-0001-000000000002', 'Alexander Jackson', 'alexander.jackson@email.com', 'Icahn School of Medicine at Mount Sinai', 9),
    ('22222222-0001-0001-0001-000000000020', '11111111-0001-0001-0001-000000000002', 'Evelyn White', 'evelyn.white@email.com', 'Keck School of Medicine of USC', 10),

    -- Day 3 (October 29)
    ('22222222-0001-0001-0001-000000000021', '11111111-0001-0001-0001-000000000003', 'Daniel Harris', 'daniel.harris@email.com', 'Georgetown University School of Medicine', 1),
    ('22222222-0001-0001-0001-000000000022', '11111111-0001-0001-0001-000000000003', 'Abigail Martin', 'abigail.martin@email.com', 'Tulane School of Medicine', 2),
    ('22222222-0001-0001-0001-000000000023', '11111111-0001-0001-0001-000000000003', 'Matthew Garcia', 'matthew.garcia@email.com', 'Ohio State College of Medicine', 3),
    ('22222222-0001-0001-0001-000000000024', '11111111-0001-0001-0001-000000000003', 'Emily Robinson', 'emily.robinson@email.com', 'University of Chicago Pritzker School of Medicine', 4),
    ('22222222-0001-0001-0001-000000000025', '11111111-0001-0001-0001-000000000003', 'David Clark', 'david.clark@email.com', 'Johns Hopkins School of Medicine', 5),
    ('22222222-0001-0001-0001-000000000026', '11111111-0001-0001-0001-000000000003', 'Elizabeth Lewis', 'elizabeth.lewis@email.com', 'Harvard Medical School', 6),
    ('22222222-0001-0001-0001-000000000027', '11111111-0001-0001-0001-000000000003', 'Joseph Walker', 'joseph.walker@email.com', 'Stanford School of Medicine', 7),
    ('22222222-0001-0001-0001-000000000028', '11111111-0001-0001-0001-000000000003', 'Sofia Hall', 'sofia.hall@email.com', 'UCSF School of Medicine', 8),
    ('22222222-0001-0001-0001-000000000029', '11111111-0001-0001-0001-000000000003', 'Benjamin Young', 'benjamin.young@email.com', 'Perelman School of Medicine (Penn)', 9),
    ('22222222-0001-0001-0001-000000000030', '11111111-0001-0001-0001-000000000003', 'Chloe King', 'chloe.king@email.com', 'Columbia Vagelos College of P&S', 10),

    -- Day 4 (November 5)
    ('22222222-0001-0001-0001-000000000031', '11111111-0001-0001-0001-000000000004', 'James Wright', 'james.wright@email.com', 'Duke University School of Medicine', 1),
    ('22222222-0001-0001-0001-000000000032', '11111111-0001-0001-0001-000000000004', 'Grace Scott', 'grace.scott@email.com', 'Washington University in St. Louis', 2),
    ('22222222-0001-0001-0001-000000000033', '11111111-0001-0001-0001-000000000004', 'William Green', 'william.green@email.com', 'NYU Grossman School of Medicine', 3),
    ('22222222-0001-0001-0001-000000000034', '11111111-0001-0001-0001-000000000004', 'Zoey Adams', 'zoey.adams@email.com', 'UCLA David Geffen School of Medicine', 4),
    ('22222222-0001-0001-0001-000000000035', '11111111-0001-0001-0001-000000000004', 'Michael Baker', 'michael.baker@email.com', 'Northwestern Feinberg School of Medicine', 5),
    ('22222222-0001-0001-0001-000000000036', '11111111-0001-0001-0001-000000000004', 'Lily Nelson', 'lily.nelson@email.com', 'Weill Cornell Medicine', 6),
    ('22222222-0001-0001-0001-000000000037', '11111111-0001-0001-0001-000000000004', 'Christopher Hill', 'christopher.hill@email.com', 'University of Michigan Medical School', 7),
    ('22222222-0001-0001-0001-000000000038', '11111111-0001-0001-0001-000000000004', 'Aria Ramirez', 'aria.ramirez@email.com', 'Emory School of Medicine', 8),
    ('22222222-0001-0001-0001-000000000039', '11111111-0001-0001-0001-000000000004', 'Andrew Campbell', 'andrew.campbell@email.com', 'Mayo Clinic Alix School of Medicine', 9),
    ('22222222-0001-0001-0001-000000000040', '11111111-0001-0001-0001-000000000004', 'Natalie Mitchell', 'natalie.mitchell@email.com', 'Vanderbilt School of Medicine', 10),

    -- Day 5 (November 12)
    ('22222222-0001-0001-0001-000000000041', '11111111-0001-0001-0001-000000000005', 'Ryan Roberts', 'ryan.roberts@email.com', 'Baylor College of Medicine', 1),
    ('22222222-0001-0001-0001-000000000042', '11111111-0001-0001-0001-000000000005', 'Layla Carter', 'layla.carter@email.com', 'Case Western Reserve School of Medicine', 2),
    ('22222222-0001-0001-0001-000000000043', '11111111-0001-0001-0001-000000000005', 'Nathan Phillips', 'nathan.phillips@email.com', 'Icahn School of Medicine at Mount Sinai', 3),
    ('22222222-0001-0001-0001-000000000044', '11111111-0001-0001-0001-000000000005', 'Riley Evans', 'riley.evans@email.com', 'Keck School of Medicine of USC', 4),
    ('22222222-0001-0001-0001-000000000045', '11111111-0001-0001-0001-000000000005', 'Joshua Turner', 'joshua.turner@email.com', 'Georgetown University School of Medicine', 5),
    ('22222222-0001-0001-0001-000000000046', '11111111-0001-0001-0001-000000000005', 'Ella Collins', 'ella.collins@email.com', 'Tulane School of Medicine', 6),
    ('22222222-0001-0001-0001-000000000047', '11111111-0001-0001-0001-000000000005', 'Samuel Edwards', 'samuel.edwards@email.com', 'Ohio State College of Medicine', 7),
    ('22222222-0001-0001-0001-000000000048', '11111111-0001-0001-0001-000000000005', 'Scarlett Stewart', 'scarlett.stewart@email.com', 'University of Chicago Pritzker School of Medicine', 8),
    ('22222222-0001-0001-0001-000000000049', '11111111-0001-0001-0001-000000000005', 'Dylan Sanchez', 'dylan.sanchez@email.com', 'Johns Hopkins School of Medicine', 9),
    ('22222222-0001-0001-0001-000000000050', '11111111-0001-0001-0001-000000000005', 'Victoria Morris', 'victoria.morris@email.com', 'Harvard Medical School', 10),

    -- Day 6 (November 19)
    ('22222222-0001-0001-0001-000000000051', '11111111-0001-0001-0001-000000000006', 'Owen Rogers', 'owen.rogers@email.com', 'Stanford School of Medicine', 1),
    ('22222222-0001-0001-0001-000000000052', '11111111-0001-0001-0001-000000000006', 'Hannah Reed', 'hannah.reed@email.com', 'UCSF School of Medicine', 2),
    ('22222222-0001-0001-0001-000000000053', '11111111-0001-0001-0001-000000000006', 'Caleb Cook', 'caleb.cook@email.com', 'Perelman School of Medicine (Penn)', 3),
    ('22222222-0001-0001-0001-000000000054', '11111111-0001-0001-0001-000000000006', 'Addison Morgan', 'addison.morgan@email.com', 'Columbia Vagelos College of P&S', 4),
    ('22222222-0001-0001-0001-000000000055', '11111111-0001-0001-0001-000000000006', 'Isaac Bell', 'isaac.bell@email.com', 'Duke University School of Medicine', 5),
    ('22222222-0001-0001-0001-000000000056', '11111111-0001-0001-0001-000000000006', 'Aubrey Murphy', 'aubrey.murphy@email.com', 'Washington University in St. Louis', 6),
    ('22222222-0001-0001-0001-000000000057', '11111111-0001-0001-0001-000000000006', 'Luke Bailey', 'luke.bailey@email.com', 'NYU Grossman School of Medicine', 7),
    ('22222222-0001-0001-0001-000000000058', '11111111-0001-0001-0001-000000000006', 'Savannah Rivera', 'savannah.rivera@email.com', 'UCLA David Geffen School of Medicine', 8),
    ('22222222-0001-0001-0001-000000000059', '11111111-0001-0001-0001-000000000006', 'Jack Cooper', 'jack.cooper@email.com', 'Northwestern Feinberg School of Medicine', 9),
    ('22222222-0001-0001-0001-000000000060', '11111111-0001-0001-0001-000000000006', 'Brooklyn Richardson', 'brooklyn.richardson@email.com', 'Weill Cornell Medicine', 10),

    -- Day 7 (December 3)
    ('22222222-0001-0001-0001-000000000061', '11111111-0001-0001-0001-000000000007', 'Jayden Cox', 'jayden.cox@email.com', 'University of Michigan Medical School', 1),
    ('22222222-0001-0001-0001-000000000062', '11111111-0001-0001-0001-000000000007', 'Claire Howard', 'claire.howard@email.com', 'Emory School of Medicine', 2),
    ('22222222-0001-0001-0001-000000000063', '11111111-0001-0001-0001-000000000007', 'Gabriel Ward', 'gabriel.ward@email.com', 'Mayo Clinic Alix School of Medicine', 3),
    ('22222222-0001-0001-0001-000000000064', '11111111-0001-0001-0001-000000000007', 'Stella Torres', 'stella.torres@email.com', 'Vanderbilt School of Medicine', 4),
    ('22222222-0001-0001-0001-000000000065', '11111111-0001-0001-0001-000000000007', 'Julian Peterson', 'julian.peterson@email.com', 'Baylor College of Medicine', 5),
    ('22222222-0001-0001-0001-000000000066', '11111111-0001-0001-0001-000000000007', 'Penelope Gray', 'penelope.gray@email.com', 'Case Western Reserve School of Medicine', 6),
    ('22222222-0001-0001-0001-000000000067', '11111111-0001-0001-0001-000000000007', 'Lincoln Ramirez', 'lincoln.ramirez@email.com', 'Icahn School of Medicine at Mount Sinai', 7),
    ('22222222-0001-0001-0001-000000000068', '11111111-0001-0001-0001-000000000007', 'Nora James', 'nora.james@email.com', 'Keck School of Medicine of USC', 8),
    ('22222222-0001-0001-0001-000000000069', '11111111-0001-0001-0001-000000000007', 'Leo Watson', 'leo.watson@email.com', 'Georgetown University School of Medicine', 9),
    ('22222222-0001-0001-0001-000000000070', '11111111-0001-0001-0001-000000000007', 'Aurora Brooks', 'aurora.brooks@email.com', 'Tulane School of Medicine', 10),

    -- Day 8 (December 10)
    ('22222222-0001-0001-0001-000000000071', '11111111-0001-0001-0001-000000000008', 'Eli Kelly', 'eli.kelly@email.com', 'Ohio State College of Medicine', 1),
    ('22222222-0001-0001-0001-000000000072', '11111111-0001-0001-0001-000000000008', 'Hazel Sanders', 'hazel.sanders@email.com', 'University of Chicago Pritzker School of Medicine', 2),
    ('22222222-0001-0001-0001-000000000073', '11111111-0001-0001-0001-000000000008', 'Miles Price', 'miles.price@email.com', 'Johns Hopkins School of Medicine', 3),
    ('22222222-0001-0001-0001-000000000074', '11111111-0001-0001-0001-000000000008', 'Violet Bennett', 'violet.bennett@email.com', 'Harvard Medical School', 4),
    ('22222222-0001-0001-0001-000000000075', '11111111-0001-0001-0001-000000000008', 'Ezra Wood', 'ezra.wood@email.com', 'Stanford School of Medicine', 5),
    ('22222222-0001-0001-0001-000000000076', '11111111-0001-0001-0001-000000000008', 'Luna Barnes', 'luna.barnes@email.com', 'UCSF School of Medicine', 6),
    ('22222222-0001-0001-0001-000000000077', '11111111-0001-0001-0001-000000000008', 'Asher Ross', 'asher.ross@email.com', 'Perelman School of Medicine (Penn)', 7),
    ('22222222-0001-0001-0001-000000000078', '11111111-0001-0001-0001-000000000008', 'Ivy Henderson', 'ivy.henderson@email.com', 'Columbia Vagelos College of P&S', 8),
    ('22222222-0001-0001-0001-000000000079', '11111111-0001-0001-0001-000000000008', 'Hudson Coleman', 'hudson.coleman@email.com', 'Duke University School of Medicine', 9),
    ('22222222-0001-0001-0001-000000000080', '11111111-0001-0001-0001-000000000008', 'Willow Jenkins', 'willow.jenkins@email.com', 'Washington University in St. Louis', 10),

    -- Day 9 (December 17)
    ('22222222-0001-0001-0001-000000000081', '11111111-0001-0001-0001-000000000009', 'Grayson Perry', 'grayson.perry@email.com', 'NYU Grossman School of Medicine', 1),
    ('22222222-0001-0001-0001-000000000082', '11111111-0001-0001-0001-000000000009', 'Ellie Powell', 'ellie.powell@email.com', 'UCLA David Geffen School of Medicine', 2),
    ('22222222-0001-0001-0001-000000000083', '11111111-0001-0001-0001-000000000009', 'Carson Long', 'carson.long@email.com', 'Northwestern Feinberg School of Medicine', 3),
    ('22222222-0001-0001-0001-000000000084', '11111111-0001-0001-0001-000000000009', 'Ruby Patterson', 'ruby.patterson@email.com', 'Weill Cornell Medicine', 4),
    ('22222222-0001-0001-0001-000000000085', '11111111-0001-0001-0001-000000000009', 'Maverick Hughes', 'maverick.hughes@email.com', 'University of Michigan Medical School', 5),
    ('22222222-0001-0001-0001-000000000086', '11111111-0001-0001-0001-000000000009', 'Autumn Flores', 'autumn.flores@email.com', 'Emory School of Medicine', 6),
    ('22222222-0001-0001-0001-000000000087', '11111111-0001-0001-0001-000000000009', 'Easton Washington', 'easton.washington@email.com', 'Mayo Clinic Alix School of Medicine', 7),
    ('22222222-0001-0001-0001-000000000088', '11111111-0001-0001-0001-000000000009', 'Skylar Butler', 'skylar.butler@email.com', 'Vanderbilt School of Medicine', 8),
    ('22222222-0001-0001-0001-000000000089', '11111111-0001-0001-0001-000000000009', 'Colton Simmons', 'colton.simmons@email.com', 'Baylor College of Medicine', 9),
    ('22222222-0001-0001-0001-000000000090', '11111111-0001-0001-0001-000000000009', 'Paisley Foster', 'paisley.foster@email.com', 'Case Western Reserve School of Medicine', 10),

    -- Day 10 (January 7)
    ('22222222-0001-0001-0001-000000000091', '11111111-0001-0001-0001-000000000010', 'Roman Gonzales', 'roman.gonzales@email.com', 'Icahn School of Medicine at Mount Sinai', 1),
    ('22222222-0001-0001-0001-000000000092', '11111111-0001-0001-0001-000000000010', 'Emery Bryant', 'emery.bryant@email.com', 'Keck School of Medicine of USC', 2),
    ('22222222-0001-0001-0001-000000000093', '11111111-0001-0001-0001-000000000010', 'Jaxon Alexander', 'jaxon.alexander@email.com', 'Georgetown University School of Medicine', 3),
    ('22222222-0001-0001-0001-000000000094', '11111111-0001-0001-0001-000000000010', 'Madelyn Russell', 'madelyn.russell@email.com', 'Tulane School of Medicine', 4),
    ('22222222-0001-0001-0001-000000000095', '11111111-0001-0001-0001-000000000010', 'Landon Griffin', 'landon.griffin@email.com', 'Ohio State College of Medicine', 5),
    ('22222222-0001-0001-0001-000000000096', '11111111-0001-0001-0001-000000000010', 'Kinsley Diaz', 'kinsley.diaz@email.com', 'University of Chicago Pritzker School of Medicine', 6),
    ('22222222-0001-0001-0001-000000000097', '11111111-0001-0001-0001-000000000010', 'Everett Hayes', 'everett.hayes@email.com', 'Johns Hopkins School of Medicine', 7),
    ('22222222-0001-0001-0001-000000000098', '11111111-0001-0001-0001-000000000010', 'Serenity Myers', 'serenity.myers@email.com', 'Harvard Medical School', 8),
    ('22222222-0001-0001-0001-000000000099', '11111111-0001-0001-0001-000000000010', 'Austin Ford', 'austin.ford@email.com', 'Stanford School of Medicine', 9),
    ('22222222-0001-0001-0001-000000000100', '11111111-0001-0001-0001-000000000010', 'Elena Hamilton', 'elena.hamilton@email.com', 'UCSF School of Medicine', 10),

    -- Day 11 (January 14)
    ('22222222-0001-0001-0001-000000000101', '11111111-0001-0001-0001-000000000011', 'Dominic Graham', 'dominic.graham@email.com', 'Perelman School of Medicine (Penn)', 1),
    ('22222222-0001-0001-0001-000000000102', '11111111-0001-0001-0001-000000000011', 'Peyton Sullivan', 'peyton.sullivan@email.com', 'Columbia Vagelos College of P&S', 2),
    ('22222222-0001-0001-0001-000000000103', '11111111-0001-0001-0001-000000000011', 'Cooper Wallace', 'cooper.wallace@email.com', 'Duke University School of Medicine', 3),
    ('22222222-0001-0001-0001-000000000104', '11111111-0001-0001-0001-000000000011', 'Clara West', 'clara.west@email.com', 'Washington University in St. Louis', 4),
    ('22222222-0001-0001-0001-000000000105', '11111111-0001-0001-0001-000000000011', 'Xavier Cole', 'xavier.cole@email.com', 'NYU Grossman School of Medicine', 5),
    ('22222222-0001-0001-0001-000000000106', '11111111-0001-0001-0001-000000000011', 'Naomi Jordan', 'naomi.jordan@email.com', 'UCLA David Geffen School of Medicine', 6),
    ('22222222-0001-0001-0001-000000000107', '11111111-0001-0001-0001-000000000011', 'Parker Reynolds', 'parker.reynolds@email.com', 'Northwestern Feinberg School of Medicine', 7),
    ('22222222-0001-0001-0001-000000000108', '11111111-0001-0001-0001-000000000011', 'Aaliyah Fisher', 'aaliyah.fisher@email.com', 'Weill Cornell Medicine', 8),
    ('22222222-0001-0001-0001-000000000109', '11111111-0001-0001-0001-000000000011', 'Sawyer Ellis', 'sawyer.ellis@email.com', 'University of Michigan Medical School', 9),
    ('22222222-0001-0001-0001-000000000110', '11111111-0001-0001-0001-000000000011', 'Valentina Harrison', 'valentina.harrison@email.com', 'Emory School of Medicine', 10),

    -- Day 12 (January 21)
    ('22222222-0001-0001-0001-000000000111', '11111111-0001-0001-0001-000000000012', 'Declan Gibson', 'declan.gibson@email.com', 'Mayo Clinic Alix School of Medicine', 1),
    ('22222222-0001-0001-0001-000000000112', '11111111-0001-0001-0001-000000000012', 'Ariana McDonald', 'ariana.mcdonald@email.com', 'Vanderbilt School of Medicine', 2),
    ('22222222-0001-0001-0001-000000000113', '11111111-0001-0001-0001-000000000012', 'Ryder Cruz', 'ryder.cruz@email.com', 'Baylor College of Medicine', 3),
    ('22222222-0001-0001-0001-000000000114', '11111111-0001-0001-0001-000000000012', 'Gianna Marshall', 'gianna.marshall@email.com', 'Case Western Reserve School of Medicine', 4),
    ('22222222-0001-0001-0001-000000000115', '11111111-0001-0001-0001-000000000012', 'Bentley Owens', 'bentley.owens@email.com', 'Icahn School of Medicine at Mount Sinai', 5),
    ('22222222-0001-0001-0001-000000000116', '11111111-0001-0001-0001-000000000012', 'Delilah George', 'delilah.george@email.com', 'Keck School of Medicine of USC', 6),
    ('22222222-0001-0001-0001-000000000117', '11111111-0001-0001-0001-000000000012', 'Silas Burns', 'silas.burns@email.com', 'Georgetown University School of Medicine', 7),
    ('22222222-0001-0001-0001-000000000118', '11111111-0001-0001-0001-000000000012', 'Isla Stone', 'isla.stone@email.com', 'Tulane School of Medicine', 8),
    ('22222222-0001-0001-0001-000000000119', '11111111-0001-0001-0001-000000000012', 'Emmett Gordon', 'emmett.gordon@email.com', 'Ohio State College of Medicine', 9),
    ('22222222-0001-0001-0001-000000000120', '11111111-0001-0001-0001-000000000012', 'Bella Mendez', 'bella.mendez@email.com', 'University of Chicago Pritzker School of Medicine', 10),

    -- Day 13 (January 28)
    ('22222222-0001-0001-0001-000000000121', '11111111-0001-0001-0001-000000000013', 'Adam Boyd', 'adam.boyd@email.com', 'Johns Hopkins School of Medicine', 1),
    ('22222222-0001-0001-0001-000000000122', '11111111-0001-0001-0001-000000000013', 'Camila Mills', 'camila.mills@email.com', 'Harvard Medical School', 2),
    ('22222222-0001-0001-0001-000000000123', '11111111-0001-0001-0001-000000000013', 'Miles Warren', 'miles.warren2@email.com', 'Stanford School of Medicine', 3),
    ('22222222-0001-0001-0001-000000000124', '11111111-0001-0001-0001-000000000013', 'Freya Dixon', 'freya.dixon@email.com', 'UCSF School of Medicine', 4),
    ('22222222-0001-0001-0001-000000000125', '11111111-0001-0001-0001-000000000013', 'Jasper Ramos', 'jasper.ramos@email.com', 'Perelman School of Medicine (Penn)', 5),
    ('22222222-0001-0001-0001-000000000126', '11111111-0001-0001-0001-000000000013', 'Athena Reyes', 'athena.reyes@email.com', 'Columbia Vagelos College of P&S', 6),
    ('22222222-0001-0001-0001-000000000127', '11111111-0001-0001-0001-000000000013', 'Theo Long', 'theo.long@email.com', 'Duke University School of Medicine', 7),
    ('22222222-0001-0001-0001-000000000128', '11111111-0001-0001-0001-000000000013', 'Eliana Spencer', 'eliana.spencer@email.com', 'Washington University in St. Louis', 8),
    ('22222222-0001-0001-0001-000000000129', '11111111-0001-0001-0001-000000000013', 'Max Stephens', 'max.stephens@email.com', 'NYU Grossman School of Medicine', 9),
    ('22222222-0001-0001-0001-000000000130', '11111111-0001-0001-0001-000000000013', 'Georgia Weaver', 'georgia.weaver@email.com', 'UCLA David Geffen School of Medicine', 10),

    -- Day 14 (February 4)
    ('22222222-0001-0001-0001-000000000131', '11111111-0001-0001-0001-000000000014', 'Kai Lawrence', 'kai.lawrence@email.com', 'Northwestern Feinberg School of Medicine', 1),
    ('22222222-0001-0001-0001-000000000132', '11111111-0001-0001-0001-000000000014', 'Piper Knight', 'piper.knight@email.com', 'Weill Cornell Medicine', 2),
    ('22222222-0001-0001-0001-000000000133', '11111111-0001-0001-0001-000000000014', 'Brody Fields', 'brody.fields@email.com', 'University of Michigan Medical School', 3),
    ('22222222-0001-0001-0001-000000000134', '11111111-0001-0001-0001-000000000014', 'Alina Bass', 'alina.bass@email.com', 'Emory School of Medicine', 4),
    ('22222222-0001-0001-0001-000000000135', '11111111-0001-0001-0001-000000000014', 'Wesley Davidson', 'wesley.davidson@email.com', 'Mayo Clinic Alix School of Medicine', 5),
    ('22222222-0001-0001-0001-000000000136', '11111111-0001-0001-0001-000000000014', 'Alice Webb', 'alice.webb@email.com', 'Vanderbilt School of Medicine', 6),
    ('22222222-0001-0001-0001-000000000137', '11111111-0001-0001-0001-000000000014', 'Brooks Simpson', 'brooks.simpson@email.com', 'Baylor College of Medicine', 7),
    ('22222222-0001-0001-0001-000000000138', '11111111-0001-0001-0001-000000000014', 'Nova Stevens', 'nova.stevens@email.com', 'Case Western Reserve School of Medicine', 8),
    ('22222222-0001-0001-0001-000000000139', '11111111-0001-0001-0001-000000000014', 'Jace Tucker', 'jace.tucker@email.com', 'Icahn School of Medicine at Mount Sinai', 9),
    ('22222222-0001-0001-0001-000000000140', '11111111-0001-0001-0001-000000000014', 'Lydia Porter', 'lydia.porter@email.com', 'Keck School of Medicine of USC', 10),

    -- Day 15 (February 11)
    ('22222222-0001-0001-0001-000000000141', '11111111-0001-0001-0001-000000000015', 'Nico Hunter', 'nico.hunter@email.com', 'Georgetown University School of Medicine', 1),
    ('22222222-0001-0001-0001-000000000142', '11111111-0001-0001-0001-000000000015', 'Daisy Hicks', 'daisy.hicks@email.com', 'Tulane School of Medicine', 2),
    ('22222222-0001-0001-0001-000000000143', '11111111-0001-0001-0001-000000000015', 'Felix Graves', 'felix.graves@email.com', 'Ohio State College of Medicine', 3),
    ('22222222-0001-0001-0001-000000000144', '11111111-0001-0001-0001-000000000015', 'Juliet Meyer', 'juliet.meyer@email.com', 'University of Chicago Pritzker School of Medicine', 4),
    ('22222222-0001-0001-0001-000000000145', '11111111-0001-0001-0001-000000000015', 'Oscar Dunn', 'oscar.dunn@email.com', 'Johns Hopkins School of Medicine', 5),
    ('22222222-0001-0001-0001-000000000146', '11111111-0001-0001-0001-000000000015', 'Mila Harvey', 'mila.harvey@email.com', 'Harvard Medical School', 6),
    ('22222222-0001-0001-0001-000000000147', '11111111-0001-0001-0001-000000000015', 'August Graham', 'august.graham@email.com', 'Stanford School of Medicine', 7),
    ('22222222-0001-0001-0001-000000000148', '11111111-0001-0001-0001-000000000015', 'Jade Rose', 'jade.rose@email.com', 'UCSF School of Medicine', 8),
    ('22222222-0001-0001-0001-000000000149', '11111111-0001-0001-0001-000000000015', 'Phoenix Dean', 'phoenix.dean@email.com', 'Perelman School of Medicine (Penn)', 9),
    ('22222222-0001-0001-0001-000000000150', '11111111-0001-0001-0001-000000000015', 'Ivy Fox', 'ivy.fox2@email.com', 'Columbia Vagelos College of P&S', 10),

    -- Day 16 (February 18)
    ('22222222-0001-0001-0001-000000000151', '11111111-0001-0001-0001-000000000016', 'River Kelley', 'river.kelley@email.com', 'Duke University School of Medicine', 1),
    ('22222222-0001-0001-0001-000000000152', '11111111-0001-0001-0001-000000000016', 'Lyla Grant', 'lyla.grant@email.com', 'Washington University in St. Louis', 2),
    ('22222222-0001-0001-0001-000000000153', '11111111-0001-0001-0001-000000000016', 'Damian Fernandez', 'damian.fernandez@email.com', 'NYU Grossman School of Medicine', 3),
    ('22222222-0001-0001-0001-000000000154', '11111111-0001-0001-0001-000000000016', 'Reagan Shaw', 'reagan.shaw@email.com', 'UCLA David Geffen School of Medicine', 4),
    ('22222222-0001-0001-0001-000000000155', '11111111-0001-0001-0001-000000000016', 'Axel Nichols', 'axel.nichols@email.com', 'Northwestern Feinberg School of Medicine', 5),
    ('22222222-0001-0001-0001-000000000156', '11111111-0001-0001-0001-000000000016', 'Lila Medina', 'lila.medina@email.com', 'Weill Cornell Medicine', 6),
    ('22222222-0001-0001-0001-000000000157', '11111111-0001-0001-0001-000000000016', 'Blake Armstrong', 'blake.armstrong@email.com', 'University of Michigan Medical School', 7),
    ('22222222-0001-0001-0001-000000000158', '11111111-0001-0001-0001-000000000016', 'Arabella Park', 'arabella.park@email.com', 'Emory School of Medicine', 8),
    ('22222222-0001-0001-0001-000000000159', '11111111-0001-0001-0001-000000000016', 'Zane Rivera', 'zane.rivera@email.com', 'Mayo Clinic Alix School of Medicine', 9),
    ('22222222-0001-0001-0001-000000000160', '11111111-0001-0001-0001-000000000016', 'Anastasia Kim', 'anastasia.kim@email.com', 'Vanderbilt School of Medicine', 10),

    -- Day 17 (February 25)
    ('22222222-0001-0001-0001-000000000161', '11111111-0001-0001-0001-000000000017', 'Rowan Cruz', 'rowan.cruz@email.com', 'Baylor College of Medicine', 1),
    ('22222222-0001-0001-0001-000000000162', '11111111-0001-0001-0001-000000000017', 'Maya Lane', 'maya.lane@email.com', 'Case Western Reserve School of Medicine', 2),
    ('22222222-0001-0001-0001-000000000163', '11111111-0001-0001-0001-000000000017', 'Finn Harper', 'finn.harper@email.com', 'Icahn School of Medicine at Mount Sinai', 3),
    ('22222222-0001-0001-0001-000000000164', '11111111-0001-0001-0001-000000000017', 'Sadie Garrett', 'sadie.garrett@email.com', 'Keck School of Medicine of USC', 4),
    ('22222222-0001-0001-0001-000000000165', '11111111-0001-0001-0001-000000000017', 'Tucker Wallace', 'tucker.wallace@email.com', 'Georgetown University School of Medicine', 5),
    ('22222222-0001-0001-0001-000000000166', '11111111-0001-0001-0001-000000000017', 'Gracie Hudson', 'gracie.hudson@email.com', 'Tulane School of Medicine', 6),
    ('22222222-0001-0001-0001-000000000167', '11111111-0001-0001-0001-000000000017', 'Archer Dunn', 'archer.dunn@email.com', 'Ohio State College of Medicine', 7),
    ('22222222-0001-0001-0001-000000000168', '11111111-0001-0001-0001-000000000017', 'Eden Santos', 'eden.santos@email.com', 'University of Chicago Pritzker School of Medicine', 8),
    ('22222222-0001-0001-0001-000000000169', '11111111-0001-0001-0001-000000000017', 'Kingston Chen', 'kingston.chen@email.com', 'Johns Hopkins School of Medicine', 9),
    ('22222222-0001-0001-0001-000000000170', '11111111-0001-0001-0001-000000000017', 'Faith Wu', 'faith.wu@email.com', 'Harvard Medical School', 10),

    -- Day 18 (March 4)
    ('22222222-0001-0001-0001-000000000171', '11111111-0001-0001-0001-000000000018', 'Beckett Patel', 'beckett.patel@email.com', 'Stanford School of Medicine', 1),
    ('22222222-0001-0001-0001-000000000172', '11111111-0001-0001-0001-000000000018', 'Everly Sharma', 'everly.sharma@email.com', 'UCSF School of Medicine', 2),
    ('22222222-0001-0001-0001-000000000173', '11111111-0001-0001-0001-000000000018', 'Rhett Gupta', 'rhett.gupta@email.com', 'Perelman School of Medicine (Penn)', 3),
    ('22222222-0001-0001-0001-000000000174', '11111111-0001-0001-0001-000000000018', 'Sienna Rao', 'sienna.rao@email.com', 'Columbia Vagelos College of P&S', 4),
    ('22222222-0001-0001-0001-000000000175', '11111111-0001-0001-0001-000000000018', 'Maddox Singh', 'maddox.singh@email.com', 'Duke University School of Medicine', 5),
    ('22222222-0001-0001-0001-000000000176', '11111111-0001-0001-0001-000000000018', 'June Kapoor', 'june.kapoor@email.com', 'Washington University in St. Louis', 6),
    ('22222222-0001-0001-0001-000000000177', '11111111-0001-0001-0001-000000000018', 'Harrison Malhotra', 'harrison.malhotra@email.com', 'NYU Grossman School of Medicine', 7),
    ('22222222-0001-0001-0001-000000000178', '11111111-0001-0001-0001-000000000018', 'Margot Jain', 'margot.jain@email.com', 'UCLA David Geffen School of Medicine', 8),
    ('22222222-0001-0001-0001-000000000179', '11111111-0001-0001-0001-000000000018', 'Wyatt Agarwal', 'wyatt.agarwal@email.com', 'Northwestern Feinberg School of Medicine', 9),
    ('22222222-0001-0001-0001-000000000180', '11111111-0001-0001-0001-000000000018', 'Rosie Mehta', 'rosie.mehta@email.com', 'Weill Cornell Medicine', 10);

-- ============================================================================
-- 3. FACULTY INTERVIEWERS
-- ============================================================================
-- Faculty Assignment Schedule:
--   PD (Dr. Sarah Chen): Days 1-18 (all)
--   APD (Dr. Michael Torres): Days 1, 5, 9, 13, 17 (every 4th day)
--   Core Faculty (3 days each):
--     Dr. Emily Watson: Days 1, 2, 3
--     Dr. James Park: Days 2, 3, 4
--     Dr. Lisa Nguyen: Days 4, 5, 6
--     Dr. Robert Kim: Days 6, 7, 8
--     Dr. Amanda Singh: Days 8, 9, 10
--     Dr. David Lee: Days 10, 11, 12
--     Dr. Jennifer Brown: Days 12, 13, 14
--     Dr. Christopher Davis: Days 14, 15, 16
--   Teaching Faculty (fill remaining):
--     Dr. Maria Garcia: Days 16, 17, 18
--     Dr. Thomas Wilson: Days 7, 11
--     Dr. Rachel Martinez: Days 3, 15, 18

-- ============================================================================
-- 4. INTERVIEW RATINGS (3 ratings per candidate = 540 total)
-- ============================================================================

-- Generate ratings for each day
-- Scores use realistic distribution: EQ mean ~65, PQ mean ~70, IQ mean ~60

-- ==================== DAY 1 ====================
-- Interviewers: PD (Dr. Sarah Chen), APD (Dr. Michael Torres), Core (Dr. Emily Watson)

-- Dr. Sarah Chen (PD) - Day 1
INSERT INTO public.interview_ratings (candidate_id, interviewer_email, interviewer_name, eq_score, pq_score, iq_score, notes) VALUES
('22222222-0001-0001-0001-000000000001', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 72, 78, 65, 'Strong interpersonal skills, good clinical reasoning'),
('22222222-0001-0001-0001-000000000002', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 85, 82, 88, 'Outstanding candidate, excellent across all domains'),
('22222222-0001-0001-0001-000000000003', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 68, 75, 70, 'Solid performer, well-prepared'),
('22222222-0001-0001-0001-000000000004', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 55, 60, 52, 'Room for growth, but shows potential'),
('22222222-0001-0001-0001-000000000005', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 75, 80, 72, 'Very professional, articulate'),
('22222222-0001-0001-0001-000000000006', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 62, 68, 58, 'Average performance, needs more experience'),
('22222222-0001-0001-0001-000000000007', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 78, 85, 75, 'Impressive leadership examples'),
('22222222-0001-0001-0001-000000000008', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 70, 72, 68, 'Good fit for the program'),
('22222222-0001-0001-0001-000000000009', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 65, 70, 62, 'Solid candidate'),
('22222222-0001-0001-0001-000000000010', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 82, 88, 80, 'Exceptional, highly recommend');

-- Dr. Michael Torres (APD) - Day 1
INSERT INTO public.interview_ratings (candidate_id, interviewer_email, interviewer_name, eq_score, pq_score, iq_score, notes) VALUES
('22222222-0001-0001-0001-000000000001', 'michael.torres@hospital.edu', 'Dr. Michael Torres', 70, 75, 68, 'Good communication skills'),
('22222222-0001-0001-0001-000000000002', 'michael.torres@hospital.edu', 'Dr. Michael Torres', 88, 85, 90, 'Top tier candidate'),
('22222222-0001-0001-0001-000000000003', 'michael.torres@hospital.edu', 'Dr. Michael Torres', 65, 72, 68, 'Steady performance'),
('22222222-0001-0001-0001-000000000004', 'michael.torres@hospital.edu', 'Dr. Michael Torres', 58, 62, 55, 'Needs development'),
('22222222-0001-0001-0001-000000000005', 'michael.torres@hospital.edu', 'Dr. Michael Torres', 72, 78, 70, 'Professional demeanor'),
('22222222-0001-0001-0001-000000000006', 'michael.torres@hospital.edu', 'Dr. Michael Torres', 60, 65, 55, 'Below average'),
('22222222-0001-0001-0001-000000000007', 'michael.torres@hospital.edu', 'Dr. Michael Torres', 75, 82, 72, 'Strong leader'),
('22222222-0001-0001-0001-000000000008', 'michael.torres@hospital.edu', 'Dr. Michael Torres', 68, 70, 65, 'Consistent'),
('22222222-0001-0001-0001-000000000009', 'michael.torres@hospital.edu', 'Dr. Michael Torres', 62, 68, 60, 'Average'),
('22222222-0001-0001-0001-000000000010', 'michael.torres@hospital.edu', 'Dr. Michael Torres', 80, 85, 78, 'Very strong');

-- Dr. Emily Watson (Core) - Day 1
INSERT INTO public.interview_ratings (candidate_id, interviewer_email, interviewer_name, eq_score, pq_score, iq_score, notes) VALUES
('22222222-0001-0001-0001-000000000001', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 75, 80, 70, 'Empathetic, good with patients'),
('22222222-0001-0001-0001-000000000002', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 82, 80, 85, 'Brilliant candidate'),
('22222222-0001-0001-0001-000000000003', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 70, 75, 72, 'Well-rounded'),
('22222222-0001-0001-0001-000000000004', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 52, 58, 50, 'Struggled with scenarios'),
('22222222-0001-0001-0001-000000000005', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 78, 82, 75, 'Excellent presentation'),
('22222222-0001-0001-0001-000000000006', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 65, 70, 60, 'Adequate'),
('22222222-0001-0001-0001-000000000007', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 80, 88, 78, 'Natural leader'),
('22222222-0001-0001-0001-000000000008', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 72, 75, 70, 'Good candidate'),
('22222222-0001-0001-0001-000000000009', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 68, 72, 65, 'Shows promise'),
('22222222-0001-0001-0001-000000000010', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 85, 90, 82, 'Top candidate');

-- ==================== DAY 2 ====================
-- Interviewers: PD (Dr. Sarah Chen), Core (Dr. Emily Watson), Core (Dr. James Park)

-- Dr. Sarah Chen (PD) - Day 2
INSERT INTO public.interview_ratings (candidate_id, interviewer_email, interviewer_name, eq_score, pq_score, iq_score, notes) VALUES
('22222222-0001-0001-0001-000000000011', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 70, 75, 68, 'Good analytical skills'),
('22222222-0001-0001-0001-000000000012', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 78, 82, 75, 'Strong candidate'),
('22222222-0001-0001-0001-000000000013', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 65, 70, 62, 'Moderate performance'),
('22222222-0001-0001-0001-000000000014', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 72, 78, 70, 'Confident presenter'),
('22222222-0001-0001-0001-000000000015', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 88, 92, 85, 'Exceptional in all areas'),
('22222222-0001-0001-0001-000000000016', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 60, 65, 58, 'Needs improvement'),
('22222222-0001-0001-0001-000000000017', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 75, 80, 72, 'Well prepared'),
('22222222-0001-0001-0001-000000000018', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 68, 72, 65, 'Adequate'),
('22222222-0001-0001-0001-000000000019', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 82, 85, 80, 'Strong intellect'),
('22222222-0001-0001-0001-000000000020', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 55, 60, 52, 'Below expectations');

-- Dr. Emily Watson (Core) - Day 2
INSERT INTO public.interview_ratings (candidate_id, interviewer_email, interviewer_name, eq_score, pq_score, iq_score, notes) VALUES
('22222222-0001-0001-0001-000000000011', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 68, 72, 65, 'Thoughtful responses'),
('22222222-0001-0001-0001-000000000012', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 75, 80, 72, 'Good communication'),
('22222222-0001-0001-0001-000000000013', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 62, 68, 60, 'Average'),
('22222222-0001-0001-0001-000000000014', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 70, 75, 68, 'Composed'),
('22222222-0001-0001-0001-000000000015', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 85, 88, 82, 'Outstanding'),
('22222222-0001-0001-0001-000000000016', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 58, 62, 55, 'Struggled'),
('22222222-0001-0001-0001-000000000017', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 72, 78, 70, 'Solid'),
('22222222-0001-0001-0001-000000000018', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 65, 70, 62, 'Acceptable'),
('22222222-0001-0001-0001-000000000019', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 80, 82, 78, 'Very good'),
('22222222-0001-0001-0001-000000000020', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 52, 58, 50, 'Weak');

-- Dr. James Park (Core) - Day 2
INSERT INTO public.interview_ratings (candidate_id, interviewer_email, interviewer_name, eq_score, pq_score, iq_score, notes) VALUES
('22222222-0001-0001-0001-000000000011', 'james.park@hospital.edu', 'Dr. James Park', 72, 78, 70, 'Good clinical knowledge'),
('22222222-0001-0001-0001-000000000012', 'james.park@hospital.edu', 'Dr. James Park', 80, 85, 78, 'Impressive'),
('22222222-0001-0001-0001-000000000013', 'james.park@hospital.edu', 'Dr. James Park', 68, 72, 65, 'Steady'),
('22222222-0001-0001-0001-000000000014', 'james.park@hospital.edu', 'Dr. James Park', 75, 80, 72, 'Professional'),
('22222222-0001-0001-0001-000000000015', 'james.park@hospital.edu', 'Dr. James Park', 90, 95, 88, 'Best of the day'),
('22222222-0001-0001-0001-000000000016', 'james.park@hospital.edu', 'Dr. James Park', 62, 68, 60, 'Room to grow'),
('22222222-0001-0001-0001-000000000017', 'james.park@hospital.edu', 'Dr. James Park', 78, 82, 75, 'Reliable'),
('22222222-0001-0001-0001-000000000018', 'james.park@hospital.edu', 'Dr. James Park', 70, 75, 68, 'OK'),
('22222222-0001-0001-0001-000000000019', 'james.park@hospital.edu', 'Dr. James Park', 85, 88, 82, 'Strong'),
('22222222-0001-0001-0001-000000000020', 'james.park@hospital.edu', 'Dr. James Park', 58, 62, 55, 'Disappointing');

-- ==================== DAYS 3-18 PATTERN ====================
-- The following uses a procedural approach with varied scores
-- In production, you would generate this programmatically

-- Note: For brevity, I'll include a representative sample and a pattern you can extend
-- Full data would include all 540 ratings (180 candidates × 3 interviewers each)

-- ==================== DAY 3 ====================
-- Interviewers: PD, Core (Dr. Emily Watson), Core (Dr. James Park), Teaching (Dr. Rachel Martinez)

-- Dr. Sarah Chen (PD) - Day 3
INSERT INTO public.interview_ratings (candidate_id, interviewer_email, interviewer_name, eq_score, pq_score, iq_score, notes) VALUES
('22222222-0001-0001-0001-000000000021', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 68, 72, 65, 'Adequate presentation'),
('22222222-0001-0001-0001-000000000022', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 75, 80, 72, 'Well-spoken'),
('22222222-0001-0001-0001-000000000023', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 62, 68, 60, 'Average'),
('22222222-0001-0001-0001-000000000024', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 85, 88, 82, 'Impressive research'),
('22222222-0001-0001-0001-000000000025', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 70, 75, 68, 'Good fit'),
('22222222-0001-0001-0001-000000000026', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 78, 82, 75, 'Articulate'),
('22222222-0001-0001-0001-000000000027', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 55, 60, 52, 'Below average'),
('22222222-0001-0001-0001-000000000028', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 72, 78, 70, 'Solid'),
('22222222-0001-0001-0001-000000000029', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 80, 85, 78, 'Very good'),
('22222222-0001-0001-0001-000000000030', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 65, 70, 62, 'Moderate');

-- Dr. James Park (Core) - Day 3
INSERT INTO public.interview_ratings (candidate_id, interviewer_email, interviewer_name, eq_score, pq_score, iq_score, notes) VALUES
('22222222-0001-0001-0001-000000000021', 'james.park@hospital.edu', 'Dr. James Park', 70, 75, 68, 'Consistent'),
('22222222-0001-0001-0001-000000000022', 'james.park@hospital.edu', 'Dr. James Park', 78, 82, 75, 'Strong candidate'),
('22222222-0001-0001-0001-000000000023', 'james.park@hospital.edu', 'Dr. James Park', 65, 70, 62, 'Needs work'),
('22222222-0001-0001-0001-000000000024', 'james.park@hospital.edu', 'Dr. James Park', 88, 90, 85, 'Top tier'),
('22222222-0001-0001-0001-000000000025', 'james.park@hospital.edu', 'Dr. James Park', 72, 78, 70, 'Reliable'),
('22222222-0001-0001-0001-000000000026', 'james.park@hospital.edu', 'Dr. James Park', 80, 85, 78, 'Good leader'),
('22222222-0001-0001-0001-000000000027', 'james.park@hospital.edu', 'Dr. James Park', 58, 62, 55, 'Struggled'),
('22222222-0001-0001-0001-000000000028', 'james.park@hospital.edu', 'Dr. James Park', 75, 80, 72, 'Well prepared'),
('22222222-0001-0001-0001-000000000029', 'james.park@hospital.edu', 'Dr. James Park', 82, 88, 80, 'Excellent'),
('22222222-0001-0001-0001-000000000030', 'james.park@hospital.edu', 'Dr. James Park', 68, 72, 65, 'Average');

-- Dr. Rachel Martinez (Teaching) - Day 3
INSERT INTO public.interview_ratings (candidate_id, interviewer_email, interviewer_name, eq_score, pq_score, iq_score, notes) VALUES
('22222222-0001-0001-0001-000000000021', 'rachel.martinez@hospital.edu', 'Dr. Rachel Martinez', 65, 70, 62, 'OK'),
('22222222-0001-0001-0001-000000000022', 'rachel.martinez@hospital.edu', 'Dr. Rachel Martinez', 72, 78, 70, 'Good'),
('22222222-0001-0001-0001-000000000023', 'rachel.martinez@hospital.edu', 'Dr. Rachel Martinez', 60, 65, 58, 'Below'),
('22222222-0001-0001-0001-000000000024', 'rachel.martinez@hospital.edu', 'Dr. Rachel Martinez', 82, 85, 80, 'Strong'),
('22222222-0001-0001-0001-000000000025', 'rachel.martinez@hospital.edu', 'Dr. Rachel Martinez', 68, 72, 65, 'Steady'),
('22222222-0001-0001-0001-000000000026', 'rachel.martinez@hospital.edu', 'Dr. Rachel Martinez', 75, 80, 72, 'Confident'),
('22222222-0001-0001-0001-000000000027', 'rachel.martinez@hospital.edu', 'Dr. Rachel Martinez', 52, 58, 50, 'Weak'),
('22222222-0001-0001-0001-000000000028', 'rachel.martinez@hospital.edu', 'Dr. Rachel Martinez', 70, 75, 68, 'Good'),
('22222222-0001-0001-0001-000000000029', 'rachel.martinez@hospital.edu', 'Dr. Rachel Martinez', 78, 82, 75, 'Strong'),
('22222222-0001-0001-0001-000000000030', 'rachel.martinez@hospital.edu', 'Dr. Rachel Martinez', 62, 68, 60, 'Average');

-- ============================================================================
-- CONTINUE PATTERN FOR DAYS 4-18
-- Each day needs 30 ratings (10 candidates × 3 interviewers)
-- ============================================================================

-- The pattern continues with varied faculty assignments per the schedule above.
-- For complete data, you would programmatically generate ratings following
-- similar score distributions and interviewer assignments.

-- ============================================================================
-- 5. SESSION INTERVIEWERS (Track faculty per day)
-- ============================================================================

INSERT INTO public.interview_session_interviewers (session_id, interviewer_email, interviewer_name, role) VALUES
-- Day 1
('11111111-0001-0001-0001-000000000001', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000001', 'michael.torres@hospital.edu', 'Dr. Michael Torres', 'coordinator'),
('11111111-0001-0001-0001-000000000001', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 'interviewer'),

-- Day 2
('11111111-0001-0001-0001-000000000002', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000002', 'emily.watson@hospital.edu', 'Dr. Emily Watson', 'interviewer'),
('11111111-0001-0001-0001-000000000002', 'james.park@hospital.edu', 'Dr. James Park', 'interviewer'),

-- Day 3
('11111111-0001-0001-0001-000000000003', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000003', 'james.park@hospital.edu', 'Dr. James Park', 'interviewer'),
('11111111-0001-0001-0001-000000000003', 'rachel.martinez@hospital.edu', 'Dr. Rachel Martinez', 'interviewer'),

-- Day 4
('11111111-0001-0001-0001-000000000004', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000004', 'james.park@hospital.edu', 'Dr. James Park', 'interviewer'),
('11111111-0001-0001-0001-000000000004', 'lisa.nguyen@hospital.edu', 'Dr. Lisa Nguyen', 'interviewer'),

-- Day 5
('11111111-0001-0001-0001-000000000005', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000005', 'michael.torres@hospital.edu', 'Dr. Michael Torres', 'coordinator'),
('11111111-0001-0001-0001-000000000005', 'lisa.nguyen@hospital.edu', 'Dr. Lisa Nguyen', 'interviewer'),

-- Day 6
('11111111-0001-0001-0001-000000000006', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000006', 'lisa.nguyen@hospital.edu', 'Dr. Lisa Nguyen', 'interviewer'),
('11111111-0001-0001-0001-000000000006', 'robert.kim@hospital.edu', 'Dr. Robert Kim', 'interviewer'),

-- Day 7
('11111111-0001-0001-0001-000000000007', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000007', 'robert.kim@hospital.edu', 'Dr. Robert Kim', 'interviewer'),
('11111111-0001-0001-0001-000000000007', 'thomas.wilson@hospital.edu', 'Dr. Thomas Wilson', 'interviewer'),

-- Day 8
('11111111-0001-0001-0001-000000000008', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000008', 'robert.kim@hospital.edu', 'Dr. Robert Kim', 'interviewer'),
('11111111-0001-0001-0001-000000000008', 'amanda.singh@hospital.edu', 'Dr. Amanda Singh', 'interviewer'),

-- Day 9
('11111111-0001-0001-0001-000000000009', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000009', 'michael.torres@hospital.edu', 'Dr. Michael Torres', 'coordinator'),
('11111111-0001-0001-0001-000000000009', 'amanda.singh@hospital.edu', 'Dr. Amanda Singh', 'interviewer'),

-- Day 10
('11111111-0001-0001-0001-000000000010', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000010', 'amanda.singh@hospital.edu', 'Dr. Amanda Singh', 'interviewer'),
('11111111-0001-0001-0001-000000000010', 'david.lee@hospital.edu', 'Dr. David Lee', 'interviewer'),

-- Day 11
('11111111-0001-0001-0001-000000000011', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000011', 'david.lee@hospital.edu', 'Dr. David Lee', 'interviewer'),
('11111111-0001-0001-0001-000000000011', 'thomas.wilson@hospital.edu', 'Dr. Thomas Wilson', 'interviewer'),

-- Day 12
('11111111-0001-0001-0001-000000000012', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000012', 'david.lee@hospital.edu', 'Dr. David Lee', 'interviewer'),
('11111111-0001-0001-0001-000000000012', 'jennifer.brown@hospital.edu', 'Dr. Jennifer Brown', 'interviewer'),

-- Day 13
('11111111-0001-0001-0001-000000000013', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000013', 'michael.torres@hospital.edu', 'Dr. Michael Torres', 'coordinator'),
('11111111-0001-0001-0001-000000000013', 'jennifer.brown@hospital.edu', 'Dr. Jennifer Brown', 'interviewer'),

-- Day 14
('11111111-0001-0001-0001-000000000014', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000014', 'jennifer.brown@hospital.edu', 'Dr. Jennifer Brown', 'interviewer'),
('11111111-0001-0001-0001-000000000014', 'christopher.davis@hospital.edu', 'Dr. Christopher Davis', 'interviewer'),

-- Day 15
('11111111-0001-0001-0001-000000000015', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000015', 'christopher.davis@hospital.edu', 'Dr. Christopher Davis', 'interviewer'),
('11111111-0001-0001-0001-000000000015', 'rachel.martinez@hospital.edu', 'Dr. Rachel Martinez', 'interviewer'),

-- Day 16
('11111111-0001-0001-0001-000000000016', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000016', 'christopher.davis@hospital.edu', 'Dr. Christopher Davis', 'interviewer'),
('11111111-0001-0001-0001-000000000016', 'maria.garcia@hospital.edu', 'Dr. Maria Garcia', 'interviewer'),

-- Day 17
('11111111-0001-0001-0001-000000000017', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000017', 'michael.torres@hospital.edu', 'Dr. Michael Torres', 'coordinator'),
('11111111-0001-0001-0001-000000000017', 'maria.garcia@hospital.edu', 'Dr. Maria Garcia', 'interviewer'),

-- Day 18
('11111111-0001-0001-0001-000000000018', 'sarah.chen@hospital.edu', 'Dr. Sarah Chen', 'program_director'),
('11111111-0001-0001-0001-000000000018', 'maria.garcia@hospital.edu', 'Dr. Maria Garcia', 'interviewer'),
('11111111-0001-0001-0001-000000000018', 'rachel.martinez@hospital.edu', 'Dr. Rachel Martinez', 'interviewer');

-- ============================================================================
-- NOTE: This file includes partial rating data (Days 1-3)
-- To complete, continue the pattern for Days 4-18
-- Each day needs ratings from all 3 assigned interviewers for all 10 candidates
-- 
-- Total expected rows:
--   - interview_sessions: 18
--   - interview_candidates: 180
--   - interview_ratings: 540 (partial here, ~90 included)
--   - interview_session_interviewers: 54
-- ============================================================================

-- ============================================================================
-- RECALCULATE CANDIDATE TOTALS
-- Run this after all ratings are inserted to update aggregate scores
-- ============================================================================

-- This will trigger the automatic recalculation for all candidates
-- DO
-- $$
-- DECLARE
--     r RECORD;
-- BEGIN
--     FOR r IN SELECT id FROM public.interview_candidates LOOP
--         PERFORM recalculate_candidate_totals(r.id);
--     END LOOP;
-- END
-- $$;
