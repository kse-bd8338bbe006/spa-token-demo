# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend (with frontend assets bundled in)
FROM eclipse-temurin:21-jdk AS backend-build
WORKDIR /app
COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./backend/src/main/resources/static/
WORKDIR /app/backend
RUN chmod +x gradlew && ./gradlew build -x test --no-daemon

# Stage 3: Runtime
FROM eclipse-temurin:21-jre
RUN groupadd -r appuser && useradd -r -g appuser -u 1000 appuser
WORKDIR /app
COPY --from=backend-build /app/backend/build/libs/*.jar app.jar
RUN chown -R appuser:appuser /app
USER 1000
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
