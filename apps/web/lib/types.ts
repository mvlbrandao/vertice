export interface Club {
  id: string;
  sofascore_id: number | null;
  name: string;
  country: string | null;
  logo_url: string | null;
}

export interface Player {
  id: string;
  sofascore_id: number | null;
  full_name: string;
  known_as: string | null;
  birth_date: string | null;
  height_cm: number | null;
  preferred_foot: string | null;
  nationality: string | null;
  position: string | null;
  photo_url: string | null;
  current_club_id: string | null;
  jersey_number: number | null;
  market_value_eur: number | null;
  contract_until: string | null;
}

export interface Match {
  id: string;
  sofascore_id: number | null;
  competition: string | null;
  season: string | null;
  round: string | null;
  match_date: string | null;
  home_club_id: string | null;
  away_club_id: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string | null;
}

export interface PlayerMatchStats {
  id: string;
  player_id: string;
  match_id: string;
  minutes_played: number | null;
  rating: number | null;
  goals: number;
  assists: number;
  shots: number;
  key_passes: number;
  passes_completed: number | null;
  passes_attempted: number | null;
  duels_won: number | null;
  duels_total: number | null;
  position_played: string | null;
  was_starter: boolean | null;
}

export interface MarketValueEntry {
  as_of_date: string;
  value_eur: number;
  source: string;
}

export interface NewsItem {
  id: string;
  source: string;
  title: string;
  title_original: string | null;
  language_original: string | null;
  url: string | null;
  published_at: string | null;
  summary: string | null;
}

export interface UpcomingFixture {
  id: string;
  match_id: string;
  opponent_club_id: string | null;
  competition: string | null;
  match_date: string | null;
  is_probable_starter: boolean | null;
  notes: string | null;
}

export interface FocusAreaKpi {
  k: string;
  base: string;
  meta: string;
  est?: boolean;
}

export interface DevelopmentFocusArea {
  id: string;
  slug: string;
  title: string;
  priority: "Crítica" | "Alta" | "Média";
  diagnosis: string | null;
  actions: string[] | null;
  kpis: FocusAreaKpi[] | null;
  sort_order: number;
}

export interface DecisionCriterion {
  id: string;
  slug: string;
  name: string;
  default_weight: number;
  description: string | null;
  sort_order: number;
}

export interface CareerScenario {
  id: string;
  slug: string;
  name: string;
  tag: string | null;
  note: string | null;
  scores: Record<string, number>;
  sort_order: number;
}

export interface CollectorRun {
  id: string;
  source: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "error";
  records_upserted: number;
  error_message: string | null;
}

export interface UserNote {
  id: string;
  user_id: string;
  note_type: string | null;
  content: string;
  created_at: string;
}
