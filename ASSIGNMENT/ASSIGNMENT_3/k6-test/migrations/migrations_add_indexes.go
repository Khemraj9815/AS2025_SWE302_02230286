package db

import (
    "log"

    "gorm.io/gorm"
)

func AddIndexes(db *gorm.DB) {
    // Article.created_at
    if !db.Migrator().HasIndex(&models.Article{}, "idx_article_created_at") {
        db.Migrator().CreateIndex(&models.Article{}, "CreatedAt")
    }

    // Article.slug
    if !db.Migrator().HasIndex(&models.Article{}, "idx_article_slug") {
        db.Migrator().CreateIndex(&models.Article{}, "Slug")
    }

    // Comment.article_id
    if !db.Migrator().HasIndex(&models.Comment{}, "idx_comment_article_id") {
        db.Migrator().CreateIndex(&models.Comment{}, "ArticleID")
    }
}
