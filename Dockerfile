# Estágio 1: Compilação do Frontend React
FROM node:18-alpine AS frontend-builder
WORKDIR /app/BusTrackerFrontend
COPY BusTrackerFrontend/package*.json ./
RUN npm install
COPY BusTrackerFrontend/ ./
RUN npm run build

# Estágio 2: Compilação do Backend .NET 8
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-builder
WORKDIR /app
COPY BusTrackerAPI/*.csproj ./BusTrackerAPI/
RUN dotnet restore ./BusTrackerAPI/BusTrackerAPI.csproj
COPY BusTrackerAPI/ ./BusTrackerAPI/
# Copia o build do frontend gerado no estágio anterior para o wwwroot do backend
COPY --from=frontend-builder /app/BusTrackerAPI/wwwroot/ ./BusTrackerAPI/wwwroot/
RUN dotnet publish ./BusTrackerAPI/BusTrackerAPI.csproj -c Release -o /app/publish

# Estágio 3: Contêiner de Execução (Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=backend-builder /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "BusTrackerAPI.dll"]
