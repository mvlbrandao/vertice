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
  top_speed_kmh: number | null;
  distance_km: number | null;
  high_speed_running_km: number | null;
  sprinting_km: number | null;
  sprints_count: number | null;
  heatmap_data: { heatmap: { x: number; y: number }[] } | null;
}

export interface PlayerSeasonStats {
  id: string;
  player_id: string;
  club_id: string | null;
  competition: string;
  season: string;
  is_loan: boolean;
  appearances: number | null;
  matches_started: number | null;
  minutes_played: number | null;
  goals: number | null;
  assists: number | null;
  avg_rating: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  pass_accuracy_pct: number | null;
  duels_won: number | null;
  duels_total: number | null;
  key_passes: number | null;
  crosses_completed: number | null;
  crosses_total: number | null;
  interceptions: number | null;
  clearances: number | null;
  distance_km: number | null;
  top_speed_kmh: number | null;
  source: string;
}

export interface PositionBenchmarkEntry {
  name: string;
  team: string;
  league?: string;
  rating: number | null;
  goals: number;
  assists: number;
  note?: string;
}

export interface PlayerPositionBenchmark {
  position_code: string;
  position_label: string;
  own_rating: number | null;
  own_rating_source: string | null;
  own_league_name: string | null;
  own_league_season: string | null;
  own_league_rank: number | null;
  own_league_pool_note: string | null;
  same_league_top5: PositionBenchmarkEntry[];
  top_leagues_rank: number | null;
  top_leagues_pool_note: string | null;
  top_leagues_top5: PositionBenchmarkEntry[];
  data_notes: string | null;
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

export interface OpponentThreat {
  name: string;
  position: string;
  note: string;
  rating: number | null;
  goals: number;
  assists: number;
  minutes: number;
  games: number;
  competition: string;
  risk: "alto" | "medio" | "baixo";
}

export interface PlayerWatchPoint {
  title: string;
  note: string;
  severity: "atencao" | "ok" | "info";
}

export interface FixtureScouting {
  context: string;
  opponent_threats: OpponentThreat[];
  player_watch_points: PlayerWatchPoint[];
}

export interface UpcomingFixture {
  id: string;
  match_id: string;
  opponent_club_id: string | null;
  competition: string | null;
  match_date: string | null;
  is_probable_starter: boolean | null;
  notes: string | null;
  scouting: FixtureScouting | null;
}

export interface FocusAreaKpi {
  k: string;
  base: string;
  meta: string;
  est?: boolean;
  peers?: { name: string; value: string }[];
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

export type StaffRole = "atleta" | "preparador_fisico" | "analista_tatico" | "empresario" | "medico" | "outro";

export interface PlayerStaffMember {
  id: string;
  player_id: string;
  role: StaffRole;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  linked_user_id: string | null;
  created_at: string;
}
