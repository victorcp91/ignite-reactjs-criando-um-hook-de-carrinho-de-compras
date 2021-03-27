import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    } else {
      const emptyCart:UpdateProductAmount[] = [];
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(emptyCart));
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productStock = await api.get(`/stock/${productId}`).then(res => res.data.amount).catch(() => {
        throw 'Erro na adição do produto';
      })

      const currentCart:Product[] = [...cart];
      const currentProductIndex = currentCart.findIndex(product => product.id === productId);
      if(currentProductIndex > -1){
        if(currentCart[currentProductIndex].amount < productStock){
          currentCart[currentProductIndex].amount += 1;
          setCart(currentCart); 
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(currentCart));
        } else{

          throw "Quantidade solicitada fora de estoque";
        }
      } else {
          const product = await api.get(`/products/${productId}`).then(res => res.data).catch(() => {
            throw 'Erro na adição do produto';
          });
          if(product){
            currentCart.push({ ...product, amount: 1});
            setCart(currentCart); 
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(currentCart));
          }
  
         
      }
    } catch(err) {
      toast.error(err);
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let currentCart:Product[] = [...cart];
      const currentProductIndex = currentCart.findIndex(product => product.id === productId);
      if(currentProductIndex > -1){
        currentCart = currentCart.filter(product => product.id !== productId);
        setCart(currentCart); 
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(currentCart));
      } else {
        throw "Erro na remoção do produto";
      }
    } catch(err) {
      toast.error(err);
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount < 1){
        throw "Erro na alteração de quantidade do produto";
      }

      const productStock = await api.get(`/stock/${productId}`).then(res => res.data.amount).catch(() => {
        throw "Erro na alteração de quantidade do produto";
      });

     
      if(productStock < amount){
        throw "Quantidade solicitada fora de estoque";
      }

      const currentCart = [...cart];
      const currentProductIndex = currentCart.findIndex(product => product.id === productId);
      if(currentProductIndex > -1){
        currentCart[currentProductIndex].amount = amount;
        setCart(currentCart); 
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(currentCart));
      } else {
        throw "Erro na alteração de quantidade do produto";
      }
    } catch(err) {
      toast.error(err);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
