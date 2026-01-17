SELECT id, session_name, session_date, to_char(session_date, 'Day') as day_of_week 
FROM interview_sessions 
ORDER BY session_date;