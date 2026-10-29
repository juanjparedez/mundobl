-- Las playlists de YouTube se guardaban con la categoria por defecto del
-- formulario ('trailer') y aparecian mezcladas con los trailers. Ahora tienen
-- su propia categoria; el API la asigna sola al guardar una URL de playlist.
UPDATE "EmbeddableContent"
SET "category" = 'playlist'
WHERE "platform" = 'YouTube'
  AND "url" ~* '^https?://(www\.|m\.)?youtube(-nocookie)?\.com/(playlist|embed/videoseries)\?'
  AND "url" !~* '[?&]v=';
