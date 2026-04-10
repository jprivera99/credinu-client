import type { ProductItem } from "@/lib/types";

interface ProductCardProps {
    product: ProductItem;
}

export function ProductCard({ product }: ProductCardProps) {
    return (
        <article className="product-card">
            <div className="product-card-top">
                <span className="product-pill">Producto</span>
                {product.disponibilidad ? (
                    <span className="product-availability">{product.disponibilidad}</span>
                ) : null}
            </div>

            <h3 className="product-title">{product.nombre_comercial}</h3>

            <ul className="product-features">
                {product.descripcion.map((item, index) => (
                    <li key={product.id + "-" + index}>{item}</li>
                ))}
            </ul>

            <button type="button" className="product-action">
                Cotizar ahora
            </button>
        </article>
    );
}