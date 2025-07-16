CREATE TABLE "user_music_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"selectedGenres" jsonb DEFAULT '[]' NOT NULL,
	"selectedArtists" jsonb DEFAULT '[]' NOT NULL,
	"selectedTracks" jsonb DEFAULT '[]' NOT NULL,
	"spotifyProfileData" jsonb,
	"lastSpotifySync" timestamp,
	"preferencesVersion" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_music_preferences" ADD CONSTRAINT "user_music_preferences_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;