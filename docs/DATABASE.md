# NEXORA AI — Database Schema Specification

## Database Technology
- **Database Engine**: MySQL 8.0+
- **Driver**: `mysql2` (with connection pooling)
- **JSON Support**: Native JSON columns for dynamic configurations, workflow AST definitions, and node context.

## Schema Overview

### 1. `users`
| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY, UUID | Unique user ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User login email |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| name | VARCHAR(255) | NOT NULL | Full name |
| role | ENUM('admin', 'user') | DEFAULT 'user' | System role |
| status | ENUM('active', 'inactive') | DEFAULT 'active' | User account state |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Created timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Updated timestamp |

### 2. `workspaces`
| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY, UUID | Unique workspace ID |
| name | VARCHAR(255) | NOT NULL | Workspace display name |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL friendly identifier |
| owner_id | VARCHAR(36) | FOREIGN KEY -> users(id) | Workspace owner |
| settings_json | JSON | NULLABLE | Custom configuration |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Created timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Updated timestamp |

### 3. `workspace_members`
| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY, UUID | Membership ID |
| workspace_id | VARCHAR(36) | FOREIGN KEY -> workspaces(id) | Target workspace |
| user_id | VARCHAR(36) | FOREIGN KEY -> users(id) | Member user |
| role | ENUM('owner', 'admin', 'editor', 'viewer') | NOT NULL | Workspace permission level |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Member join date |

### 4. `workflows`
| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY, UUID | Workflow ID |
| workspace_id | VARCHAR(36) | FOREIGN KEY -> workspaces(id) | Owning workspace |
| name | VARCHAR(255) | NOT NULL | Workflow title |
| description | TEXT | NULLABLE | Optional summary |
| is_active | BOOLEAN | DEFAULT FALSE | Execution active flag |
| current_version | INT | DEFAULT 1 | Active version number |
| definition_json | JSON | NOT NULL | React Flow nodes & edges AST |
| created_by | VARCHAR(36) | FOREIGN KEY -> users(id) | Creator user |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Created timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Updated timestamp |

### 5. `workflow_versions`
| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY, UUID | Version record ID |
| workflow_id | VARCHAR(36) | FOREIGN KEY -> workflows(id) | Parent workflow |
| version | INT | NOT NULL | Version snapshot number |
| definition_json | JSON | NOT NULL | Version graph structure |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Version timestamp |

### 6. `triggers`
| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY, UUID | Trigger ID |
| workflow_id | VARCHAR(36) | FOREIGN KEY -> workflows(id) | Target workflow |
| type | ENUM('webhook', 'cron', 'event') | NOT NULL | Trigger category |
| config_json | JSON | NOT NULL | Cron expression or webhook path |
| is_enabled | BOOLEAN | DEFAULT TRUE | Active toggle |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Trigger registration date |

### 7. `executions`
| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY, UUID | Execution run ID |
| workflow_id | VARCHAR(36) | FOREIGN KEY -> workflows(id) | Executed workflow |
| workspace_id | VARCHAR(36) | FOREIGN KEY -> workspaces(id) | Workspace context |
| trigger_type | VARCHAR(50) | NOT NULL | How execution started |
| status | ENUM('pending', 'running', 'completed', 'failed', 'retrying') | DEFAULT 'pending' | State |
| error_message | TEXT | NULLABLE | Summary failure reason |
| started_at | DATETIME | NULLABLE | Start time |
| finished_at | DATETIME | NULLABLE | End time |
| metrics_json | JSON | NULLABLE | Duration, memory, steps count |

### 8. `execution_logs`
| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY, UUID | Log entry ID |
| execution_id | VARCHAR(36) | FOREIGN KEY -> executions(id) | Parent execution run |
| step_id | VARCHAR(255) | NOT NULL | Node ID in workflow graph |
| node_name | VARCHAR(255) | NOT NULL | Display name of step |
| status | ENUM('success', 'failed', 'running', 'skipped') | NOT NULL | Step state |
| input_json | JSON | NULLABLE | Captured step inputs |
| output_json | JSON | NULLABLE | Step execution outputs |
| error_json | JSON | NULLABLE | Exception traceback |
| log_level | ENUM('info', 'warn', 'error', 'debug') | DEFAULT 'info' | Log severity |
| timestamp | DATETIME(3) | DEFAULT CURRENT_TIMESTAMP(3) | High precision log time |

### 9. `integrations`
| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY, UUID | Integration ID |
| workspace_id | VARCHAR(36) | FOREIGN KEY -> workspaces(id) | Owning workspace |
| provider | VARCHAR(100) | NOT NULL | Provider key (e.g. slack, github) |
| name | VARCHAR(255) | NOT NULL | Connection alias |
| credentials_encrypted | TEXT | NOT NULL | AES-256 encrypted payload |
| config_json | JSON | NULLABLE | OAuth scopes or API endpoints |
| is_active | BOOLEAN | DEFAULT TRUE | Active toggle |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Integration date |

### 10. `ai_conversations`
| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY, UUID | Conversation ID |
| workspace_id | VARCHAR(36) | FOREIGN KEY -> workspaces(id) | Workspace context |
| user_id | VARCHAR(36) | FOREIGN KEY -> users(id) | Interacting user |
| title | VARCHAR(255) | NOT NULL | Prompt topic |
| context_json | JSON | NULLABLE | Chat message history |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Created time |

### 11. `ai_memory`
| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY, UUID | Memory ID |
| workspace_id | VARCHAR(36) | FOREIGN KEY -> workspaces(id) | Scope |
| memory_key | VARCHAR(255) | NOT NULL | Reference key |
| memory_value_json | JSON | NOT NULL | Stored context data |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last refreshed |

### 12. `self_healing_logs`
| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY, UUID | Self-healing record |
| execution_id | VARCHAR(36) | FOREIGN KEY -> executions(id) | Target run |
| step_id | VARCHAR(255) | NOT NULL | Target node |
| error_signature | TEXT | NOT NULL | Categorized error signature |
| action_taken | TEXT | NOT NULL | AI correction attempt |
| status | ENUM('resolved', 'failed', 'escalated') | NOT NULL | Outcome |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Incident time |

### 13. `audit_logs`
| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY, UUID | Audit entry ID |
| workspace_id | VARCHAR(36) | NULLABLE | Associated workspace |
| user_id | VARCHAR(36) | NULLABLE | Actor user ID |
| action | VARCHAR(100) | NOT NULL | Action string |
| resource_type | VARCHAR(100) | NOT NULL | Target entity type |
| resource_id | VARCHAR(36) | NULLABLE | Target entity ID |
| metadata_json | JSON | NULLABLE | Change snapshot |
| ip_address | VARCHAR(45) | NULLABLE | Client IP |
| timestamp | DATETIME | DEFAULT CURRENT_TIMESTAMP | Event time |

### 14. `notifications`
| Field | Type | Attributes | Description |
|-------|------|------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY, UUID | Notification ID |
| workspace_id | VARCHAR(36) | FOREIGN KEY -> workspaces(id) | Target workspace |
| user_id | VARCHAR(36) | FOREIGN KEY -> users(id) | Target user |
| type | ENUM('execution_failure', 'system', 'approval_request') | NOT NULL | Type |
| title | VARCHAR(255) | NOT NULL | Summary line |
| message | TEXT | NOT NULL | Full detail |
| is_read | BOOLEAN | DEFAULT FALSE | Read state |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Dispatch time |
