-- Trigger to automatically create a profile for a new user in auth.users
-- This function will insert a row into public.profiles for every new sign up.
-- For the first user (usually the one setting up the app), it can default to 'owner'.
-- Later accounts created can be adjusted in the database or via an admin screen if needed.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_first_user boolean;
BEGIN
    -- Check if this is the very first profile being created
    SELECT count(*) = 0 INTO is_first_user FROM public.profiles;

    INSERT INTO public.profiles (id, household_role, display_name)
    VALUES (
        new.id,
        CASE WHEN is_first_user THEN 'owner' ELSE 'student' END, -- Default first user to owner, others to student (can be updated to co-owner manually later)
        new.raw_user_meta_data->>'display_name' -- Optional: pull display_name if passed in signup metadata
    );

    RETURN new;
END;
$$;

-- Trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
