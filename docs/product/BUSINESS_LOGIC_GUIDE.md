# Tiggpro Business Logic Guide
*Core Domain Concepts & System Architecture*

## 📋 Table of Contents
1. [Chore Management System](#chore-management-system)
2. [Assignment & Submission Flow](#assignment--submission-flow)
3. [Gamification System](#gamification-system)
4. [Multi-Tenant Architecture](#multi-tenant-architecture)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Data Relationships](#data-relationships)
7. [Common Misconceptions](#common-misconceptions)

---

## 🏠 Chore Management System

### **Template-Based Architecture**

Tiggpro uses a **template-based chore system** where chores are reusable definitions that can be assigned multiple times to different users.

#### **Core Entities:**

1. **Chores Table** (`chores`) - **Chore Templates**
   - Contains reusable chore definitions (e.g., "Clean bedroom", "Take out trash")
   - Properties: title, description, points reward, gaming time, difficulty, duration
   - Can be recurring or one-time
   - Belongs to a tenant (family/organization)

2. **Chore Assignments Table** (`chore_assignments`) - **Actual Assignments**
   - Links a chore template to a specific user with a due date
   - Each assignment represents one instance of a chore being assigned
   - Multiple assignments can reference the same chore template
   - Tracks: assigned user, due date, priority, status

3. **Chore Submissions Table** (`chore_submissions`) - **Completion Records**
   - Records when someone submits proof of completing an assignment
   - Links to the specific assignment, not the chore template
   - Contains: submission notes, media URLs, review status, points awarded

### **Why Template-Based System?**

This architecture enables:

- **Reusability**: Same chore can be assigned to multiple children
- **Consistency**: Points and rewards are standardized per chore type
- **Flexibility**: Different due dates and priorities per assignment
- **Tracking**: Individual progress per child per assignment
- **Recurring Chores**: Same template can be assigned repeatedly

### **Example Scenario:**

```
Chore Template: "Clean Bedroom" (10 points, 30 min gaming time)
├── Assignment 1: Alice, due 2025-09-27, priority: medium
├── Assignment 2: Bob, due 2025-09-28, priority: high
└── Assignment 3: Alice, due 2025-10-01, priority: low (recurring)
```

**This is perfectly valid** - Alice and Bob can both have "Clean Bedroom" assignments, and Alice can have multiple instances.

---

## 🔄 Assignment & Submission Flow

### **Complete Workflow:**

1. **Parent Creates Chore Template**
   ```typescript
   POST /tenants/:tenantId/chores
   {
     "title": "Clean Bedroom",
     "description": "Organize clothes, make bed, vacuum",
     "pointsReward": 10,
     "gamingTimeMinutes": 30,
     "difficultyLevel": "medium",
     "estimatedDurationMinutes": 45,
     "isRecurring": true,
     "recurrencePattern": { "daysOfWeek": [1, 3, 5] }
   }
   ```

2. **Parent Assigns Chore to Child**
   ```typescript
   POST /tenants/:tenantId/chores/:choreId/assign
   {
     "assignedTo": "child-user-id",
     "dueDate": "2025-09-27",
     "priority": "medium",
     "notes": "Focus on organizing the closet"
   }
   ```

3. **Child Completes Assignment**
   ```typescript
   POST /tenants/:tenantId/assignments/:assignmentId/submit
   {
     "submissionNotes": "All done! Closet is organized.",
     "mediaUrls": ["https://storage.../bedroom-after.jpg"]
   }
   ```

4. **Parent Reviews Submission**
   ```typescript
   PUT /tenants/:tenantId/assignments/submissions/:submissionId/review
   {
     "reviewStatus": "approved",
     "reviewFeedback": "Great job organizing!",
     "pointsAwarded": 10,
     "gamingTimeAwarded": 30
   }
   ```

### **Assignment Validation Logic:**

The system prevents duplicate assignments to the same user:

```typescript
// Prevents: Same chore + Same user + Pending status
const existingAssignment = await this.assignmentRepository.findOne({
  where: {
    choreId,
    assignedTo: assignChoreDto.assignedTo,
    status: AssignmentStatus.PENDING,
  },
});

if (existingAssignment) {
  throw new BadRequestException(
    'This chore is already assigned to this user',
  );
}
```

**This allows:**
- ✅ Same chore assigned to different users
- ✅ Same chore assigned to same user after completion
- ✅ Same chore assigned to same user for recurring patterns

**This prevents:**
- ❌ Same chore assigned to same user with pending status

---

## 🎮 Gamification System

### **Points & Rewards Flow:**

1. **Points are defined in chore templates** (not assignments)
2. **Points are awarded upon approval** of submissions
3. **Gaming time is converted** from points at a configurable ratio
4. **Levels are calculated** based on total points earned
5. **Streaks are tracked** based on consecutive completed assignments

### **User Points Table Structure:**

```sql
user_points:
- user_id (FK to users)
- tenant_id (FK to tenants)
- total_points (accumulated from all approved submissions)
- available_gaming_minutes (earned but not yet used)
- used_gaming_minutes (redeemed gaming time)
- current_streak_days (consecutive days with completed chores)
- longest_streak_days (best streak achieved)
- level (calculated from total_points)
```

### **Achievement System:**

- **Achievements are tenant-specific** (family achievements)
- **Triggered by various criteria**: points, streaks, levels, chores completed
- **Once earned, achievements are permanent** for that user in that tenant
- **Celebration animations** and notifications when earned

---

## 🏢 Multi-Tenant Architecture

### **Tenant Concept:**

- **Tenants** represent families, organizations, or groups
- **Each tenant is isolated** - no cross-tenant data access
- **Users can belong to multiple tenants** with different roles
- **All data is scoped to tenant** (chores, assignments, points, etc.)

### **Tenant Membership:**

```sql
tenant_members:
- tenant_id (FK to tenants)
- user_id (FK to users)
- role (admin, parent, child)
- invited_by (FK to users)
- is_active (boolean)
- joined_at (timestamp)
```

### **Data Isolation:**

All queries must include tenant context:

```typescript
// ✅ Correct - Tenant-scoped query
const chores = await this.choreRepository.find({
  where: { tenantId: currentTenant.id }
});

// ❌ Wrong - No tenant context
const chores = await this.choreRepository.find();
```

---

## 👥 User Roles & Permissions

### **Role Hierarchy:**

1. **ADMIN** - Full control over tenant
   - Create/edit/delete chores
   - Assign chores to anyone
   - Review all submissions
   - Manage tenant settings
   - Invite/remove members

2. **PARENT** - Manage children's chores
   - Create/edit/delete chores
   - Assign chores to children
   - Review children's submissions
   - View family progress

3. **CHILD** - Complete assigned chores
   - View assigned chores
   - Submit chore completions
   - View own progress and achievements
   - Redeem gaming time

### **Permission Matrix:**

| Action | ADMIN | PARENT | CHILD |
|--------|-------|--------|-------|
| Create Chores | ✅ | ✅ | ❌ |
| Assign Chores | ✅ | ✅ | ❌ |
| Submit Completions | ✅ | ✅ | ✅ |
| Review Submissions | ✅ | ✅ | ❌ |
| Manage Members | ✅ | ❌ | ❌ |
| View All Progress | ✅ | ✅ | ❌ |
| View Own Progress | ✅ | ✅ | ✅ |

---

## 🔗 Data Relationships

### **Entity Relationships:**

```
Tenant (1) ──→ (N) TenantMember
Tenant (1) ──→ (N) Chore
Tenant (1) ──→ (N) UserPoints
Tenant (1) ──→ (N) Achievement
Tenant (1) ──→ (N) Notification

Chore (1) ──→ (N) ChoreAssignment
ChoreAssignment (1) ──→ (N) ChoreSubmission

User (1) ──→ (N) TenantMember
User (1) ──→ (N) ChoreAssignment (as assignee)
User (1) ──→ (N) ChoreAssignment (as assigner)
User (1) ──→ (N) ChoreSubmission
User (1) ──→ (N) UserPoints
User (1) ──→ (N) UserAchievement
User (1) ──→ (N) Notification
```

### **Key Relationships:**

- **One chore template** can have **many assignments**
- **One assignment** can have **many submissions** (if rejected and resubmitted)
- **One user** can have **many assignments** across different chores
- **One tenant** contains **all related data** (chores, assignments, points, etc.)

---

## ❓ Common Misconceptions

### **"Same chore assigned to multiple users is a bug"**

**❌ WRONG**: This is the intended behavior.

**✅ CORRECT**: Chore templates are meant to be assigned to multiple users. For example:
- "Clean your room" assigned to Alice, Bob, and Charlie
- "Take out trash" assigned to different children on different days
- "Set the table" assigned to multiple children for dinner rotation

### **"Chores and assignments are the same thing"**

**❌ WRONG**: They serve different purposes.

**✅ CORRECT**:
- **Chores** = Templates (reusable definitions)
- **Assignments** = Instances (specific assignments to users with due dates)

### **"Points are stored in assignments"**

**❌ WRONG**: Points are defined in chore templates.

**✅ CORRECT**:
- **Points are defined** in chore templates
- **Points are awarded** when submissions are approved
- **Points are accumulated** in user_points table

### **"One assignment = one submission"**

**❌ WRONG**: Assignments can have multiple submissions.

**✅ CORRECT**:
- **First submission** might be rejected
- **Child resubmits** with better proof
- **Multiple submissions** per assignment until approved

### **"Users can only belong to one tenant"**

**❌ WRONG**: Users can belong to multiple tenants.

**✅ CORRECT**:
- **Parent** might be admin in their family tenant
- **Same parent** might be child in their parents' tenant
- **Different roles** in different tenants

---

## 🔍 Database Query Examples

### **Get all chores for a tenant:**
```sql
SELECT * FROM chores
WHERE tenant_id = 'tenant-uuid'
AND is_active = true;
```

### **Get all assignments for a user:**
```sql
SELECT ca.*, c.title, c.points_reward
FROM chore_assignments ca
JOIN chores c ON ca.chore_id = c.id
WHERE ca.assigned_to = 'user-uuid'
AND c.tenant_id = 'tenant-uuid';
```

### **Get pending submissions for review:**
```sql
SELECT cs.*, ca.assigned_to, c.title
FROM chore_submissions cs
JOIN chore_assignments ca ON cs.assignment_id = ca.id
JOIN chores c ON ca.chore_id = c.id
WHERE cs.review_status = 'pending'
AND c.tenant_id = 'tenant-uuid';
```

### **Get user's total points in tenant:**
```sql
SELECT total_points, available_gaming_minutes, level
FROM user_points
WHERE user_id = 'user-uuid'
AND tenant_id = 'tenant-uuid';
```

---

## 🚨 Important Business Rules

### **Assignment Rules:**
1. **Only parents/admins** can assign chores
2. **Cannot assign to non-members** of the tenant
3. **Cannot assign same chore to same user** if pending
4. **Can assign same chore to different users** simultaneously
5. **Can assign same chore to same user** after completion

### **Submission Rules:**
1. **Only assigned user** can submit completion
2. **Must have pending assignment** to submit
3. **Can resubmit** if previous submission was rejected
4. **Media uploads** are optional but recommended

### **Review Rules:**
1. **Only parents/admins** can review submissions
2. **Must review within reasonable time** (configurable)
3. **Can approve, reject, or request changes**
4. **Points are only awarded** upon approval
5. **Gaming time is calculated** from approved points

### **Points Rules:**
1. **Points are defined** in chore templates
2. **Points are awarded** only upon approval
3. **Points accumulate** in user_points table
4. **Gaming time conversion** is configurable per tenant
5. **Levels are calculated** from total points

---

## 📊 System Status Tracking

### **Assignment Statuses:**
- `PENDING` - Assigned but not started
- `SUBMITTED` - Completion submitted, awaiting review
- `APPROVED` - Submission approved, points awarded
- `REJECTED` - Submission rejected, can resubmit
- `OVERDUE` - Past due date, not completed

### **Submission Statuses:**
- `PENDING` - Awaiting review
- `APPROVED` - Accepted, points awarded
- `REJECTED` - Rejected, can resubmit

### **Review Statuses:**
- `PENDING` - Not yet reviewed
- `APPROVED` - Accepted
- `REJECTED` - Rejected with feedback

---

*This guide serves as the definitive reference for understanding Tiggpro's business logic and domain concepts. Keep it updated as the system evolves!*
