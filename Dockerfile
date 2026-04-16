# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy everything
COPY . ./

# Restore dependencies
RUN dotnet restore

# Publish app
RUN dotnet publish VoipBackend.csproj -c Release -o /out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app

# Copy built app from build stage
COPY --from=build /out ./

# Set URL binding
ENV ASPNETCORE_URLS=http://+:8080

# Expose port
EXPOSE 8080

# Run app
ENTRYPOINT ["dotnet", "VoipBackend.dll"]