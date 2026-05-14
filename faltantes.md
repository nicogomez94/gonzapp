Ranking

Botones de planes/publicar a WhatsApp

PRD dice que al tocar “Publicar mi auto aquí” o elegir plan debe ir a WhatsApp. Hoy los planes mandan a /login?tab=register y hasta dicen “Publicar gratis”. Esto es lo más urgente porque afecta la monetización inicial.

==Asignar plan a usuario desde el panel

El backend soporta planId, pero el modal de usuario del dashboard no tiene selector de plan. En el PRD esto está explícito: “Asignación manual de planes a usuarios”.

Alinear textos y reglas de planes

El PRD dice:

Básico: $30.000, 6 imágenes
Intermedio: $55.000, 8 imágenes, documentación verificada
Premium: $80.000, 10 fotos, informe + descuento gestoría
Cada plan permite una sola unidad
El seed está bastante alineado, pero el frontend todavía tiene textos genéricos/fallbacks incorrectos como publicaciones múltiples, gratis, agencias, estadísticas, etc.

Carga de imágenes más usable

Hoy el admin carga imágenes pegando URLs, una por línea. Para Etapa 1 puede pasar, pero si lo va a usar alguien no técnico, falta una subida real o al menos una experiencia más clara. El PRD exige galería completa.

Precio en pesos y dólares

El PRD dice precio “en pesos y en dólares”. En backend priceUsd es opcional. Si esto es obligatorio de verdad, hay que hacerlo requerido en validación/backend y en el formulario.

Control manual de límite por plan

El PRD pide control manual, no automático. Hoy se puede ver usuario/plan/publicaciones, pero no hay una pantalla clara que diga “este usuario tiene este plan y ya usó su unidad”. No es automatización, es ayuda administrativa.

Validaciones del backend

Falta endurecer datos: año válido, precio positivo, cantidad máxima de imágenes, campos obligatorios, enums, teléfono, etc. Esto evita que el panel cargue publicaciones rotas.

Filtro por ubicación

El frontend muestra ubicación, pero no está conectado bien al backend. Es menor, pero entra dentro de “filtros básicos”.

Favoritos

El PRD pide favoritos para visitantes. Ya existe con localStorage, así que para Etapa 1 lo considero aceptable. No hace falta backend salvo que quieras favoritos persistentes por cuenta.

Dashboard: estadísticas/mensajes

