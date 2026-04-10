"use client";

import { useEffect, useState } from "react";
import { getClientProducts } from "@/lib/api";
import type { ProductItem } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";

export default function ProductosPage() {
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getClientProducts()
            .then((data) => setProducts(data))
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="portal-stack">
            <div className="hero-panel">
                <div>
                    <p className="hero-kicker">Catalogo activo</p>
                    <h2>Conoce nuestros productos</h2>
                    <p>
                        Esta pantalla recrea el menu cliente de SupplyNet con mejor
                        usabilidad, mejor responsive y visual más limpio. Ejemplo xd
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="empty-state">Cargando productos...</div>
            ) : (
                <div className="product-grid">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </section>
    );
}