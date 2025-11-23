// Example: fix N+1 when loading articles with author and tags
package handlers

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

func GetArticlesHandler(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var articles []Article
        // Eager load associations to avoid N+1
        if err := db.Preload("Author").Preload("Tags").Order("created_at desc").Find(&articles).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query articles"})
            return
        }
        c.JSON(http.StatusOK, gin.H{"articles": articles})
    }
}