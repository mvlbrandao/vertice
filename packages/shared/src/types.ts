export interface Club {
  id: string;
  sofascore_id: number | null;
  name: string;
  country: string | null;
  league: string | null;
  logo_url: string | null;
}

export interface Player {
  id: string;
  sofascore_id: number | null;
  transfermarkt_id: string | null;
  fotmob_id: string | null;
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
  venue: string | null;
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
  shots_on_target: number;
  key_passes: number;
  passes_completed: number | null;
  passes_attempted: number | null;
  dribbles_completed: number | null;
  dribbles_attempted: number | null;
  duels_won: number | null;
  duels_total: number | null;
  tackles: number | null;
  interceptions: number | null;
  touches: number | null;
  fouls_committed: number | null;
  fouls_suffered: number | null;
  yellow_card: boolean;
  red_card: boolean;
  position_played: string | null;
  was_starter: boolean | null;
  heatmap_data: unknown | null;
  source: string;
  raw_json: unknown | null;
}

export type TransferType = "loan" | "permanent" | "free" | "end_of_loan";

export interface TransferHistoryEntry {
  id: string;
  player_id: string;
  from_club_id: string | null;
  to_club_id: string | null;
  transfer_date: string | null;
  fee_eur: number | null;
  transfer_type: TransferType | null;
  source: string | null;
}

export interface MarketValueEntry {
  id: string;
  player_id: string;
  as_of_date: string;
  value_eur: number;
  source: string;
}

export type InjuryStatus = "active" | "recovered";

export interface Injury {
  id: string;
  player_id: string;
  injury_type: string | null;
  start_date: string | null;
  expected_return_date: string | null;
  actual_return_date: string | null;
  status: InjuryStatus | null;
  source: string | null;
}

export type NewsCategory = "transfer" | "injury" | "performance" | "tatico" | "geral";

export interface NewsItem {
  id: string;
  player_id: string | null;
  source: string;
  title: string;
  url: string | null;
  published_at: string | null;
  summary: string | null;
  category: NewsCategory | null;
  raw_snippet: string | null;
}

export interface UpcomingFixture {
  id: string;
  player_id: string | null;
  match_id: string | null;
  opponent_club_id: string | null;
  competition: string | null;
  match_date: string | null;
  is_probable_starter: boolean | null;
  notes: string | null;
}

export interface TacticalReport {
  id: string;
  player_id: string;
  match_id: string | null;
  title: string;
  content: string | null;
  strengths: unknown | null;
  weaknesses: unknown | null;
  recommendations: string | null;
  author: string;
  generated_at: string;
}

export interface VideoClip {
  id: string;
  player_id: string | null;
  match_id: string | null;
  title: string;
  url: string;
  source: string | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
}

export type VideoEventType =
  | "drible_certo"
  | "erro_posicional"
  | "passe_chave"
  | "acao_defensiva"
  | "finalizacao"
  | "outro";

export interface VideoEvent {
  id: string;
  video_clip_id: string;
  timestamp_seconds: number;
  event_type: VideoEventType;
  description: string | null;
  tagged_by: string | null;
}

export type CollectorStatus = "running" | "success" | "error";

export interface CollectorRun {
  id: string;
  source: string;
  started_at: string;
  finished_at: string | null;
  status: CollectorStatus;
  records_upserted: number;
  error_message: string | null;
}
