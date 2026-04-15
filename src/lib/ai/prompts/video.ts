export const VIDEO_PROMPT =
  'Roteiro de vídeo horizontal 16:9. ' +
  'Cenas com: duração (ex: "8s"), narração (texto falado), visualDescription (descrição da imagem de fundo em inglês para Imagen 3), textOverlay (texto que aparece na tela), transition (fade/slide/wipe). ' +
  'Schema: {"title":string,"scenes":[{"sceneNumber":number,"duration":string,"narration":string,"visualDescription":string,"textOverlay":string,"transition":"fade"|"slide"|"wipe"}],"totalDuration":string,"music":"energetic"|"calm"|"corporate"|"fun","thumbnail":{"imagePrompt":string,"title":string},"caption":string,"hashtags":string[]}'
