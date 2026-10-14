import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss']
})
export class ProductsPage implements OnInit {
  productService = inject(ProductService);
  cartService = inject(CartService);
  route = inject(ActivatedRoute);

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];

  searchQuery = '';
  selectedCategory = 'ALL';
  sortBy = 'featured';

  ngOnInit(): void {
    this.productService.categories$.subscribe(cats => {
      this.categories = cats;
      this.applyFilters();
    });

    this.productService.products$.subscribe(prods => {
      this.allProducts = prods;
      this.applyFilters();
    });

    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategory = params['category'];
        this.applyFilters();
      }
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  applyFilters(): void {
    let prods = [...this.allProducts];

    // Category filter
    if (this.selectedCategory !== 'ALL') {
      prods = prods.filter(p => p.category === this.selectedCategory);
    }

    // Search query filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      prods = prods.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.tamilName && p.tamilName.toLowerCase().includes(q)) ||
        Object.values(p.specs).some(val => val.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (this.sortBy === 'price-asc') {
      prods.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-desc') {
      prods.sort((a, b) => b.price - a.price);
    } else if (this.sortBy === 'rating') {
      prods.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    this.filteredProducts = prods;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'ALL';
    this.sortBy = 'featured';
    this.applyFilters();
  }

  getSpecKeys(specs: { [key: string]: string }): string[] {
    return Object.keys(specs).slice(0, 2);
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
  }
}
