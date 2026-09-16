"""
SQLite database repository.
CRUD operations for documents, conversations, and messages.
All queries use parameterized statements — no SQL injection.
"""

import json
from datetime import datetime, timezone

from models.database import Database
from observability.logger import get_logger

logger = get_logger(__name__)


class DBRepository:
    """Async SQLite CRUD for conversations, documents, messages."""

    def __init__(self, db: Database):
        self.db = db

    # ── Documents ──────────────────────────────────────

    async def create_document(
        self,
        document_id: str,
        filename: str,
        mime_type: str,
        size_bytes: int,
        checksum: str | None = None,
    ) -> dict:
        """Insert a new document record."""
        now = datetime.now(timezone.utc).isoformat()
        await self.db.conn.execute(
            """INSERT INTO documents (document_id, filename, mime_type, size_bytes, status, checksum, created_at, updated_at)
               VALUES (?, ?, ?, ?, 'uploaded', ?, ?, ?)""",
            (document_id, filename, mime_type, size_bytes, checksum, now, now),
        )
        await self.db.conn.commit()
        return await self.get_document(document_id)

    async def update_document_status(
        self,
        document_id: str,
        status: str,
        chunk_count: int = 0,
        topics: list[str] | None = None,
        error_message: str | None = None,
    ) -> None:
        """Update document processing status."""
        now = datetime.now(timezone.utc).isoformat()
        topics_json = json.dumps(topics) if topics else "[]"
        await self.db.conn.execute(
            """UPDATE documents
               SET status = ?, chunk_count = ?, topics = ?, error_message = ?, updated_at = ?
               WHERE document_id = ?""",
            (status, chunk_count, topics_json, error_message, now, document_id),
        )
        await self.db.conn.commit()

    async def get_document(self, document_id: str) -> dict | None:
        """Get a single document by ID."""
        cursor = await self.db.conn.execute(
            "SELECT * FROM documents WHERE document_id = ?", (document_id,)
        )
        row = await cursor.fetchone()
        if row:
            return self._row_to_document(row)
        return None

    async def list_documents(self) -> list[dict]:
        """List all documents."""
        cursor = await self.db.conn.execute(
            "SELECT * FROM documents ORDER BY created_at DESC"
        )
        rows = await cursor.fetchall()
        return [self._row_to_document(row) for row in rows]

    async def delete_document(self, document_id: str) -> bool:
        """Delete a document and its messages."""
        cursor = await self.db.conn.execute(
            "DELETE FROM documents WHERE document_id = ?", (document_id,)
        )
        await self.db.conn.commit()
        return cursor.rowcount > 0

    async def find_document_by_checksum(self, checksum: str) -> dict | None:
        """Find a document by its file checksum (for deduplication)."""
        cursor = await self.db.conn.execute(
            "SELECT * FROM documents WHERE checksum = ?", (checksum,)
        )
        row = await cursor.fetchone()
        if row:
            return self._row_to_document(row)
        return None

    def _row_to_document(self, row) -> dict:
        """Convert a DB row to a document dict."""
        return {
            "document_id": row["document_id"],
            "filename": row["filename"],
            "mime_type": row["mime_type"],
            "size_bytes": row["size_bytes"],
            "status": row["status"],
            "chunk_count": row["chunk_count"] or 0,
            "topics": json.loads(row["topics"]) if row["topics"] else [],
            "checksum": row["checksum"],
            "error_message": row["error_message"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }

    # ── Conversations ──────────────────────────────────

    async def create_conversation(self, conversation_id: str, title: str | None = None) -> dict:
        """Create a new conversation."""
        now = datetime.now(timezone.utc).isoformat()
        await self.db.conn.execute(
            """INSERT INTO conversations (conversation_id, title, created_at, updated_at)
               VALUES (?, ?, ?, ?)""",
            (conversation_id, title, now, now),
        )
        await self.db.conn.commit()
        return {
            "conversation_id": conversation_id,
            "title": title,
            "messages": [],
            "created_at": now,
            "updated_at": now,
        }

    async def get_conversation(self, conversation_id: str) -> dict | None:
        """Get a conversation with its messages."""
        cursor = await self.db.conn.execute(
            "SELECT * FROM conversations WHERE conversation_id = ?",
            (conversation_id,),
        )
        conv_row = await cursor.fetchone()
        if not conv_row:
            return None

        # Fetch messages
        msg_cursor = await self.db.conn.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
            (conversation_id,),
        )
        msg_rows = await msg_cursor.fetchall()

        messages = []
        for row in msg_rows:
            messages.append({
                "message_id": row["message_id"],
                "sender": row["sender"],
                "text": row["text"],
                "citations": json.loads(row["citations"]) if row["citations"] else [],
                "time": row["created_at"],
            })

        return {
            "conversation_id": conv_row["conversation_id"],
            "title": conv_row["title"],
            "messages": messages,
            "created_at": conv_row["created_at"],
            "updated_at": conv_row["updated_at"],
        }

    async def list_conversations(self) -> list[dict]:
        """List all conversations (without full messages)."""
        cursor = await self.db.conn.execute(
            "SELECT * FROM conversations ORDER BY updated_at DESC"
        )
        rows = await cursor.fetchall()
        return [
            {
                "conversation_id": row["conversation_id"],
                "title": row["title"],
                "messages": [],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }
            for row in rows
        ]

    async def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation and all its messages."""
        await self.db.conn.execute(
            "DELETE FROM messages WHERE conversation_id = ?", (conversation_id,)
        )
        cursor = await self.db.conn.execute(
            "DELETE FROM conversations WHERE conversation_id = ?", (conversation_id,)
        )
        await self.db.conn.commit()
        return cursor.rowcount > 0

    # ── Messages ───────────────────────────────────────

    async def add_message(
        self,
        message_id: str,
        conversation_id: str,
        sender: str,
        text: str,
        citations: list[dict] | None = None,
        model: str | None = None,
        input_tokens: int | None = None,
        output_tokens: int | None = None,
    ) -> None:
        """Add a message to a conversation."""
        now = datetime.now(timezone.utc).isoformat()
        citations_json = json.dumps(citations) if citations else "[]"
        await self.db.conn.execute(
            """INSERT INTO messages (message_id, conversation_id, sender, text, citations, model, input_tokens, output_tokens, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (message_id, conversation_id, sender, text, citations_json, model, input_tokens, output_tokens, now),
        )
        # Update conversation timestamp
        await self.db.conn.execute(
            "UPDATE conversations SET updated_at = ? WHERE conversation_id = ?",
            (now, conversation_id),
        )
        await self.db.conn.commit()

    async def get_conversation_messages(
        self, conversation_id: str, limit: int = 20
    ) -> list[dict]:
        """Get recent messages for a conversation."""
        cursor = await self.db.conn.execute(
            """SELECT * FROM messages
               WHERE conversation_id = ?
               ORDER BY created_at DESC
               LIMIT ?""",
            (conversation_id, limit),
        )
        rows = await cursor.fetchall()
        messages = [
            {
                "message_id": row["message_id"],
                "sender": row["sender"],
                "text": row["text"],
                "citations": json.loads(row["citations"]) if row["citations"] else [],
                "time": row["created_at"],
            }
            for row in reversed(rows)  # Reverse to get chronological order
        ]
        return messages
