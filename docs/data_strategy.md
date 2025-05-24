# Data Strategy

## 1. Overview
This document outlines the strategy for data storage, export/import, and synchronization with Google Sheets. The primary goals are to ensure offline-first functionality, data portability for the user, and robust (optional) cloud backup/sync.

## 2. Local Storage
- **Mechanism:** IndexedDB via `StorageManager`.
- **Data Stored:** All application data including tasks, categories, user profile, achievements, settings, and daily mission states.

## 3. Data Export/Import (Planned)
- **Format:** Single JSON file.
- **Purpose:** Allow users to create manual backups and transfer data between devices offline.
- **Top-Level JSON Structure:**
  ```json
  {
    "export_format_version": "1.0",
    "export_timestamp": "YYYY-MM-DDTHH:mm:ssZ",
    "app_version": "X.Y.Z",
    "data": {
      "tasks": [],
      "categories": [],
      "userProfile": {},
      "achievements": [],
      "settings": {},
      "dailyMissions": {}
    }
  }
  ```
- **Data Schema Notes:**
    - Each data item (task, category, etc.) within the arrays/objects should include all its properties.
    - Crucially, each mutable item must include a `lastModified_local` (ISO 8601 timestamp) field, updated whenever the item is changed locally.

## 4. Google Sheets Synchronization (Planned Enhancements)
- **Optional:** Users can use the app entirely offline. Sync is an optional enhancement.
- **Sheet Structure:** Separate sheets for Tasks, Categories, UserProfile, Settings.
- **Conflict Resolution Principle:**
    - **Timestamps:**
        - Local items: `lastModified_local`.
        - Google Sheet rows: `lastModified_server` (written by the app during sync).
    - **General Flow:**
        1. Item changed locally: `lastModified_local` is updated.
        2. On Sync:
           - If local is newer than server version (based on `lastModified_local` vs `lastModified_server` in sheet): Push local changes to sheet. Update `lastModified_server` in sheet.
           - If server is newer: Pull server changes to local. Update `lastModified_local`.
           - **Conflict:** If an item has been modified both locally and on the server since the last successful sync (i.e., `item.lastModified_local > item.last_sync_timestamp` AND `item_in_sheet.lastModified_server > item.last_sync_timestamp` and the data differs):
               - **Default Resolution:** The version with the most recent `lastModified` timestamp (between local and server) wins.
               - **User Prompt:** For critical data or if timestamps are very close/identical with different content, prompt the user to choose which version to keep. Design of this prompt TBD.
    - **New & Deleted Items:**
        - New local items are added to the sheet.
        - New sheet items (if manually added by user in a structured way and detected by app) are added locally.
        - Deletion propagation needs careful design (e.g., soft deletes or a deletion log). Initial implementation may rely on overwrites.

## 5. Data Tampering (Google Sheets - Planned)
- To discourage manual tampering of sensitive fields in Google Sheets (e.g., task completion status, points), hash checks for critical fields might be implemented. The app would store a hash alongside the data, and verify it on read. If a mismatch occurs, it could flag the data or revert to a previous state.
