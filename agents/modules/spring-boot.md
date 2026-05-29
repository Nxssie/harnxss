# Module: Java / Spring Boot

Conventions for Spring Boot (Java 21) backends, Clean Architecture.

- **Layers**: keep domain free of framework/IO. Controller → Service → Repository; map DTOs at the
  edge, never leak JPA entities through the API.
- **Java 21**: use records for DTOs/value objects, sealed types where modelling closed hierarchies,
  pattern matching, virtual threads where they help.
- **Persistence**: JPA/Hibernate, UUID primary keys, Flyway or explicit migrations for prod (avoid
  `ddl-auto=update` outside dev). PostgreSQL is the default DB.
- **Config**: externalize via `application.yml` + env vars; CORS origins configurable by env.
- **Validation**: Bean Validation (`@Valid`) at controllers; fail fast with clear error responses.
- **Errors**: `@RestControllerAdvice` for a consistent error contract. No stack traces to clients.
- **Build/CI**: Maven/Gradle wrapper committed; GitHub Actions → container → K3s.
