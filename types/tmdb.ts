export interface TMDbData {
  backdrop_path?: string;
  genres?: TMDbGenre[];
  created_by?: TMDbCreator[];
  id: number;
  imdb_id?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  last_air_date?: string;
  status?: string;
  runtime?: number;
  tagline?: string;
  title?: string;
  name?: string;
  credits?: TMDbCredits;
  external_ids?: TMDbExternalIds;
  number_of_seasons?: number;
}

interface TMDbGenre {
  id: number;
  name: string;
}

interface TMDbCreator {
  name: string;
}

interface TMDbCredits {
  crew?: TMDbCrew[];
}

interface TMDbCrew {
  name: string;
  department?: string;
  job?: string;
}

interface TMDbExternalIds {
  imdb_id?: string;
}

export interface TMDbResults {
  backdrop_path?: string;
  id: number;
  title?: string;
  poster_path?: string | null;
  media_type: string;
  release_date?: string;
  name?: string;
  first_air_date?: string;
}
