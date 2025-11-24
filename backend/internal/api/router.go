package api

import (
	"fmt"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/mifi/lossless-cut/backend/internal/api/handlers"
	"github.com/mifi/lossless-cut/backend/internal/api/middleware"
	"github.com/mifi/lossless-cut/backend/internal/config"
	"github.com/mifi/lossless-cut/backend/internal/services"
	"go.uber.org/zap"
)

func NewRouter(services *services.Services, cfg *config.Config, logger *zap.Logger) *gin.Engine {
	router := gin.New()

	// Middleware
	router.Use(gin.Recovery())
	router.Use(middleware.Logger(logger))

	// CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = cfg.Server.CorsOrigins
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept"}
	router.Use(cors.New(corsConfig))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	api := router.Group("/api")
	{
		// System endpoints
		system := api.Group("/system")
		{
			systemHandler := handlers.NewSystemHandler(cfg, services, logger)
			system.GET("/info", systemHandler.Info)
			system.DELETE("/clear-all", systemHandler.ClearAll)
		}

		// Project endpoints
		projects := api.Group("/projects")
		{
			projectHandler := handlers.NewProjectHandler(services, logger)
			projects.POST("", projectHandler.Create)
			projects.GET("", projectHandler.List)
			projects.GET("/:id", projectHandler.Get)
			projects.PUT("/:id", projectHandler.Update)
			projects.DELETE("/:id", projectHandler.Delete)
			projects.POST("/:id/export", projectHandler.Export)

			// Segment endpoints
			segments := projects.Group("/:id/segments")
			{
				segments.POST("", projectHandler.AddSegment)
				segments.PUT("/:segmentId", projectHandler.UpdateSegment)
				segments.DELETE("/:segmentId", projectHandler.DeleteSegment)
			}
		}

		// Video endpoints
		videos := api.Group("/videos")
		{
			videoHandler := handlers.NewVideoHandler(services, cfg, logger)
			videos.POST("/upload", videoHandler.Upload)
			videos.POST("/download", videoHandler.Download)
			videos.GET("/:id/stream", videoHandler.Stream)
			videos.DELETE("/:id", videoHandler.Delete)
		}

		// Download endpoints (dedicated yt-dlp functionality)
		downloads := api.Group("/downloads")
		{
			downloadHandler := handlers.NewDownloadHandler(services, logger)
			downloads.POST("", downloadHandler.Start)
			downloads.GET("", downloadHandler.List)
			downloads.DELETE("", downloadHandler.ClearAll)
			downloads.GET("/:id", downloadHandler.Get)
			downloads.POST("/:id/cancel", downloadHandler.Cancel)
		}

		// Operation endpoints (for checking export/processing status)
		operations := api.Group("/operations")
		{
			operationHandler := handlers.NewOperationHandler(services, logger)
			operations.GET("/:id", operationHandler.GetStatus)
		}

		// Output file downloads (exported videos)
		api.GET("/outputs/:filename", func(c *gin.Context) {
			filename := c.Param("filename")
			filepath := services.Storage.GetOutputPath(filename)

			if !services.Storage.FileExists(filepath) {
				logger.Warn("Output file not found", zap.String("filename", filename))
				c.JSON(404, gin.H{"error": "file not found"})
				return
			}

			logger.Info("Serving output file", zap.String("filename", filename))
			c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
			c.File(filepath)
		})
	}

	// Serve frontend static files
	router.Static("/assets", "./web/assets")
	router.StaticFile("/", "./web/index.html")
	router.StaticFile("/index.html", "./web/index.html")

	// Catch-all for SPA routing
	router.NoRoute(func(c *gin.Context) {
		c.File("./web/index.html")
	})

	return router
}
