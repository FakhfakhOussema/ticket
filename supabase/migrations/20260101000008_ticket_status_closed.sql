-- =============================================================================
-- Nouveau statut de ticket : « Fermé » (closed)
-- Fichier séparé : une nouvelle valeur d'enum ne peut pas être utilisée
-- dans la même transaction que celle qui l'ajoute.
-- =============================================================================

alter type public.ticket_status add value if not exists 'closed' after 'done';
