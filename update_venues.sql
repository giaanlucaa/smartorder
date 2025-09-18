-- Update existing venues with unique slugs
UPDATE "Venue" SET slug = 'demo-restaurant' WHERE name = 'Demo Restaurant';
UPDATE "Venue" SET slug = 'existing-venue-' || id WHERE slug = '' OR slug IS NULL;
