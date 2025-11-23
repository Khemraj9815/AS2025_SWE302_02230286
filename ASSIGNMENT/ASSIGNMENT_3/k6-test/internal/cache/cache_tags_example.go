// Simple Redis caching for GET /api/tags (using go-redis)
package handlers

import (
    "context"
    "encoding/json"
    "net/http"
    "time"

    "github.com/go-redis/redis/v8"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

var redisClient *redis.Client // initialize in app startup

func GetTagsCachedHandler(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        ctx := context.Background()
        cacheKey := "tags:all"
        if data, err := redisClient.Get(ctx, cacheKey).Result(); err == nil {
            var tags []Tag
            if err := json.Unmarshal([]byte(data), &tags); err == nil {
                c.JSON(http.StatusOK, gin.H{"tags": tags})
                return
            }
            // if unmarshal fails fall back to DB
        }
        var tags []Tag
        if err := db.Find(&tags).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tags"})
            return
        }
        b, _ := json.Marshal(tags)
        redisClient.Set(ctx, cacheKey, b, 30*time.Second) // short TTL
        c.JSON(http.StatusOK, gin.H{"tags": tags})
    }
}