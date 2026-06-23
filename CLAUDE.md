# CLAUDE.md

Contexto e instrucciones para Claude Code en este repositorio.

## Sobre este repo

Repositorio general de desarrollo, independiente de otros proyectos. Aquí van apps web, scripts de automatización, herramientas internas, prototipos y lo que vaya surgiendo. No es un proyecto único con una arquitectura fija: cada subcarpeta o rama de trabajo puede ser un proyecto distinto con su propio stack.

Si un proyecto dentro de este repo crece y tiene necesidades propias (convenciones específicas, stack concreto, checklist propio), créale su propio `CLAUDE.md` en su carpeta — ese archivo local complementa y puede sobreescribir lo que dice este.

## Sobre mí (contexto rápido)

Médico (residente de urología), con interés fuerte en tecnología y desarrollo de herramientas propias (apps clínicas, dashboards, scripts). No soy desarrollador profesional, así que valoro que el código sea legible y bien explicado, no solo "que funcione". Prefiero respuestas directas y concisas, sin rodeos.

## Stack

No hay un stack fijo: se decide caso por caso según el proyecto. Algunas pautas generales:

- Si no se especifica nada, prioriza herramientas simples, bien documentadas y con poca configuración inicial (evitar over-engineering para prototipos).
- Antes de meter una dependencia o framework nuevo, pregúntame si no está claro por el contexto, especialmente si hay alternativas más simples con lo que ya tenemos.
- Cuando empieces un proyecto nuevo dentro de este repo, indica brevemente qué stack vas a usar y por qué, antes de generar mucho código.

## Estilo de código

- Código legible por encima de código "clever". Preferible que se entienda leyéndolo, aunque sea un poco más largo.
- Nombres de variables y funciones descriptivos, en inglés (convención estándar), salvo que el dominio del proyecto pida lo contrario.
- Comentarios solo donde aporten algo (lógica no obvia, decisiones de diseño), no para narrar lo que el código ya dice.
- Mantén la estructura de carpetas simple. No crear abstracciones o capas extra "por si acaso" si el proyecto no las necesita todavía.

## Tests

Por defecto, escribe tests automáticamente para la lógica relevante (cálculos, validaciones, casos límite, funciones core) sin que tenga que pedirlo cada vez. Como guía:

- En proyectos "de verdad" (algo que voy a mantener o usar): añade tests para la lógica importante como parte normal del trabajo, no como un extra opcional.
- En scripts muy pequeños o prototipos de usar y tirar: usa criterio — si no aporta valor real, no hace falta forzarlos, pero dilo explícitamente en vez de omitirlos en silencio.
- Si detectas o arreglas un bug, añade un test que lo cubra para que no vuelva a pasar.
- Indícame brevemente qué tests añadiste y qué cubren, sin extenderte.

## Seguridad

Tengo instalado el plugin oficial `security-guidance@claude-plugins-official` (scope de usuario), que revisa automáticamente el código en busca de vulnerabilidades comunes (inyección, deserialización insegura, XSS, etc.) mientras se trabaja y al hacer commit. No bloquea nada, solo avisa — si salta algún hallazgo, corrígelo dentro de la misma sesión salvo que sea un falso positivo claro.

## Git y commits

- No hagas commits automáticamente. Propón el mensaje de commit (siguiendo el formato de abajo) y deja que yo decida si lo ejecuto.
- Formato de mensajes: estilo [Conventional Commits](https://www.conventionalcommits.org/) cuando tenga sentido — `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, etc. — con descripción breve en presente.
- No hagas push, ni crees ramas, ni resuelvas conflictos de merge sin que te lo pida explícitamente.

## Checklist de calidad antes de dar algo por terminado

Antes de presentar una funcionalidad como lista, revisa:

- [ ] ¿El código corre sin errores con los casos de uso normales?
- [ ] ¿Maneja al menos los errores/casos límite obvios (input vacío, fallo de red, etc.)?
- [ ] ¿Hay algo hardcodeado que debería ser configurable (claves, rutas, URLs)?
- [ ] ¿Quedan imports, variables o archivos sin usar?
- [ ] Si se tocó algo ya existente, ¿sigue funcionando lo que ya funcionaba?
- [ ] ¿La solución es proporcional al problema (no sobre-ingeniería para algo simple)?

Si algo de esto no se puede verificar (por ejemplo, no hay forma de ejecutar el proyecto en este entorno), dilo explícitamente en vez de asumir que está bien.

## Cosas que sí puedes hacer sin pedir permiso

- Instalar dependencias necesarias para el proyecto en curso.
- Reorganizar/crear estructura de carpetas si mejora la claridad del proyecto.
- Sobrescribir o borrar archivos de trabajo propios del proyecto cuando sea parte natural de la tarea (ej. regenerar un build).

Si algo te parece una decisión grande o irreversible (borrar datos de usuario, cambiar algo en producción, tocar configuración fuera de este repo), pregunta primero aunque no esté listado aquí explícitamente.

## Cómo prefiero que me hables

- Directo y conciso. Si hay varias formas de hacer algo, dame tu recomendación con una razón breve, no una lista exhaustiva de opciones salvo que la pida.
- Si vas a tomar una decisión de diseño no trivial (estructura, librería, patrón), dime qué decidiste y por qué en una línea, no me lo preguntes todo si es razonable seguir adelante.
- Cuando algo no esté claro o falte contexto importante, pregunta antes de asumir.
