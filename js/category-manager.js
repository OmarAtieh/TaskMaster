// category-manager.js - Category operations

class CategoryManager {
    constructor(app) {
      this.app = app;
      this.storage = app.storage;
      this.categories = [];
      this.loaded = false;
    }
    
    // Load categories from storage
    async loadCategories() {
      try {
        const categories = await this.storage.get(null, 'categories');
        this.categories = categories || [];
        this.loaded = true;
        
        // If no categories exist, create the defaults
        if (this.categories.length === 0) {
          await this.createDefaultCategories();
        }
        
        console.log(`Loaded ${this.categories.length} categories`);
        return this.categories;
      } catch (error) {
        console.error('Error loading categories:', error);
        this.categories = [];
        // Try to create defaults on error
        await this.createDefaultCategories();
        return this.categories;
      }
    }
    
    // Create default categories for first-time setup
    async createDefaultCategories() {
      try {
        const defaultCategories = [
          {
            id: 'work',
            name: 'Work',
            color: '#5E97F6',
            icon: 'work',
            display_order: 1,
            subcategories: [
              { id: 'work-meetings', name: 'Meetings' },
              { id: 'work-projects', name: 'Projects' },
              { id: 'work-admin', name: 'Administrative' }
            ]
          },
          {
            id: 'personal',
            name: 'Personal',
            color: '#33B679',
            icon: 'home',
            display_order: 2,
            subcategories: [
              { id: 'personal-chores', name: 'Chores' },
              { id: 'personal-errands', name: 'Errands' },
              { id: 'personal-family', name: 'Family' }
            ]
          },
          {
            id: 'health',
            name: 'Health',
            color: '#F6BF26',
            icon: 'health',
            display_order: 3,
            subcategories: [
              { id: 'health-exercise', name: 'Exercise' },
              { id: 'health-nutrition', name: 'Nutrition' },
              { id: 'health-medical', name: 'Medical' }
            ]
          },
          {
            id: 'education',
            name: 'Education',
            color: '#8E24AA',
            icon: 'education',
            display_order: 4,
            subcategories: [
              { id: 'education-courses', name: 'Courses' },
              { id: 'education-reading', name: 'Reading' },
              { id: 'education-skills', name: 'Skills' }
            ]
          },
          {
            id: 'finance',
            name: 'Finance',
            color: '#039BE5',
            icon: 'finance',
            display_order: 5,
            subcategories: [
              { id: 'finance-bills', name: 'Bills' },
              { id: 'finance-savings', name: 'Savings' },
              { id: 'finance-budget', name: 'Budget' }
            ]
          },
          {
            id: 'spiritual',
            name: 'Spiritual',
            color: '#7986CB',
            icon: 'spiritual',
            display_order: 6,
            subcategories: [
              { id: 'spiritual-meditation', name: 'Meditation' },
              { id: 'spiritual-prayer', name: 'Prayer/Worship' },
              { id: 'spiritual-study', name: 'Spiritual Study' },
              { id: 'spiritual-rituals', name: 'Rituals/Practices' },
              { id: 'spiritual-community', name: 'Community' }
            ]
          },
          {
            id: 'mental',
            name: 'Mental Wellbeing',
            color: '#AB47BC',
            icon: 'mental',
            display_order: 7,
            subcategories: [
              { id: 'mental-reflection', name: 'Reflection/Journaling' },
              { id: 'mental-therapy', name: 'Therapy/Coaching' },
              { id: 'mental-mindfulness', name: 'Mindfulness' },
              { id: 'mental-stress', name: 'Stress Management' },
              { id: 'mental-growth', name: 'Personal Growth' }
            ]
          }
        ];
        
        this.categories = defaultCategories;
        
        // Save to storage
        for (const category of this.categories) {
          await this.storage.set(category.id, category, 'categories');
        }
        
        console.log('Created default categories');
        return this.categories;
      } catch (error) {
        console.error('Error creating default categories:', error);
        this.categories = [];
        return this.categories;
      }
    }
    
    // Save all categories
    async saveCategories() {
      try {
        await this.storage.clear('categories');
        if (this.categories.length > 0) {
          for (const category of this.categories) {
            await this.storage.set(category.id, category, 'categories');
          }
        }
        return true;
      } catch (error) {
        console.error('Error saving categories:', error);
        throw error;
      }
    }
    
    // Get all categories
    getCategories() {
      return [...this.categories];
    }
    
    // Get a specific category by ID
    getCategory(id) {
      return this.categories.find(cat => cat.id === id) || null;
    }
    
    // Get all subcategories for a category
    getSubcategories(categoryId) {
      const category = this.getCategory(categoryId);
      return category ? [...(category.subcategories || [])] : [];
    }
    
    // Add a new category
    async addCategory(category) {
      // Generate a unique ID if none provided
      if (!category.id) {
        category.id = 'cat_' + Date.now();
      }
      
      // Set default values for missing properties
      category = {
        display_order: this.categories.length + 1,
        subcategories: [],
        ...category
      };
      
      this.categories.push(category);
      await this.storage.set(category.id, category, 'categories');
      
      // Trigger sync if online
      if (this.app.online) {
        this.app.sync.syncCategories().catch(error => {
          console.error('Error syncing after category creation:', error);
        });
      }
      
      return category;
    }
    
    // Update an existing category
    async updateCategory(id, updates) {
      const index = this.categories.findIndex(cat => cat.id === id);
      if (index === -1) {
        return null;
      }
      
      this.categories[index] = {
        ...this.categories[index],
        ...updates,
        modified_at: new Date().toISOString()
      };
      
      await this.storage.set(id, this.categories[index], 'categories');
      
      // Trigger sync if online
      if (this.app.online) {
        this.app.sync.syncCategories().catch(error => {
          console.error('Error syncing after category update:', error);
        });
      }
      
      return this.categories[index];
    }
    
    // Delete a category
    async deleteCategory(id) {
      const index = this.categories.findIndex(cat => cat.id === id);
      if (index === -1) {
        return false;
      }
      
      // Remove from memory
      this.categories.splice(index, 1);
      
      // Remove from storage
      await this.storage.delete(id, 'categories');
      
      // Trigger sync if online
      if (this.app.online) {
        this.app.sync.syncCategories().catch(error => {
          console.error('Error syncing after category deletion:', error);
        });
      }
      
      return true;
    }
    
    // Add a subcategory to a category
    async addSubcategory(categoryId, subcategory) {
      const category = this.getCategory(categoryId);
      if (!category) {
        return null;
      }
      
      // Generate ID if not provided
      if (!subcategory.id) {
        subcategory.id = `${categoryId}-${Date.now()}`;
      }
      
      // Ensure subcategories array exists
      if (!category.subcategories) {
        category.subcategories = [];
      }
      
      // Add the subcategory
      category.subcategories.push(subcategory);
      
      // Update last modified timestamp
      category.modified_at = new Date().toISOString();
      
      // Save changes
      await this.storage.set(categoryId, category, 'categories');
      
      // Trigger sync if online
      if (this.app.online) {
        this.app.sync.syncCategories().catch(error => {
          console.error('Error syncing after subcategory addition:', error);
        });
      }
      
      return subcategory;
    }
    
    // Update a subcategory
    async updateSubcategory(categoryId, subcategoryId, updates) {
      const category = this.getCategory(categoryId);
      if (!category || !category.subcategories) {
        return null;
      }
      
      const subcategoryIndex = category.subcategories.findIndex(sub => sub.id === subcategoryId);
      if (subcategoryIndex === -1) {
        return null;
      }
      
      // Update the subcategory
      category.subcategories[subcategoryIndex] = {
        ...category.subcategories[subcategoryIndex],
        ...updates
      };
      
      // Update last modified timestamp
      category.modified_at = new Date().toISOString();
      
      // Save changes
      await this.storage.set(categoryId, category, 'categories');
      
      // Trigger sync if online
      if (this.app.online) {
        this.app.sync.syncCategories().catch(error => {
          console.error('Error syncing after subcategory update:', error);
        });
      }
      
      return category.subcategories[subcategoryIndex];
    }
    
    // Delete a subcategory
    async deleteSubcategory(categoryId, subcategoryId) {
      const category = this.getCategory(categoryId);
      if (!category || !category.subcategories) {
        return false;
      }
      
      const subcategoryIndex = category.subcategories.findIndex(sub => sub.id === subcategoryId);
      if (subcategoryIndex === -1) {
        return false;
      }
      
      // Remove the subcategory
      category.subcategories.splice(subcategoryIndex, 1);
      
      // Update last modified timestamp
      category.modified_at = new Date().toISOString();
      
      // Save changes
      await this.storage.set(categoryId, category, 'categories');
      
      // Trigger sync if online
      if (this.app.online) {
        this.app.sync.syncCategories().catch(error => {
          console.error('Error syncing after subcategory deletion:', error);
        });
      }
      
      return true;
    }
  }
  
  // Make class available globally
  window.CategoryManager = CategoryManager;