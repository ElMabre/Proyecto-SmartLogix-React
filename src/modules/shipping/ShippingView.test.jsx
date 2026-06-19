// src/modules/shipping/ShippingView.test.jsx
import { render, screen, waitFor, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ShippingView from './ShippingView';
import axiosInstance from '../../core/api/axiosInstance';

vi.mock('../../core/api/axiosInstance');

const mockShipments = [
  {
    id: 1,
    orderId: 101,
    trackingId: 'TRK-1234567890ABCDEF',
    shippingType: 'Express',
    estimatedDays: 3,
    status: 'Enviado',
    createdAt: '2025-06-15T12:00:00Z',
  },
  {
    id: 2,
    orderId: 102,
    trackingId: 'SHORT123',
    shippingType: 'Estándar',
    estimatedDays: null,
    status: 'Pendiente',
    createdAt: null,
  },
  {
    id: 3,
    orderId: 999,
    trackingId: 'TRK-NOORDER',
    shippingType: 'Express',
    estimatedDays: 2,
    status: 'Cancelado por falta de stock',
    createdAt: '2025-06-10T10:00:00Z',
  },
];

const mockOrders = [
  {
    id: 101,
    status: 'Enviado',
    customerName: 'Juan Pérez',
    shippingAddress: 'Calle Falsa 123',
  },
  {
    id: 102,
    status: 'Pendiente',
    customerName: 'María Gómez',
    shippingAddress: 'Av. Siempreviva 742',
  },
];

describe('ShippingView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axiosInstance.get.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loading and data fetching', () => {
    it('muestra spinner mientras carga', async () => {
      axiosInstance.get.mockResolvedValueOnce({ data: mockShipments });
      axiosInstance.get.mockResolvedValueOnce({ data: mockOrders });

      render(<ShippingView />);
      expect(screen.getByText('Gestión de Envíos')).toBeInTheDocument();

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/TRK-1234…/)).toBeInTheDocument();
      });
      expect(spinner).not.toBeInTheDocument();
    });

    it('renderiza tarjetas de envíos tras cargar datos', async () => {
      axiosInstance.get.mockResolvedValueOnce({ data: mockShipments });
      axiosInstance.get.mockResolvedValueOnce({ data: mockOrders });

      render(<ShippingView />);
      await waitFor(() => {
        expect(screen.getByText('Envío #1')).toBeInTheDocument();
        expect(screen.getByText('Envío #2')).toBeInTheDocument();
        expect(screen.getByText('Envío #3')).toBeInTheDocument();
      });
    });

    it('muestra mensaje de inventario vacío si no hay shipments', async () => {
      axiosInstance.get.mockResolvedValueOnce({ data: [] });
      axiosInstance.get.mockResolvedValueOnce({ data: [] });

      render(<ShippingView />);
      await waitFor(() => {
        expect(
          screen.getByText('No hay envíos registrados actualmente.'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('manejo de errores', () => {
    it('muestra error de red genérico si falla el fetch sin mensaje del servidor', async () => {
      axiosInstance.get.mockRejectedValueOnce(new Error('Network error'));

      render(<ShippingView />);
      await waitFor(() => {
        expect(
          screen.getByText('Error al obtener los envíos del servidor'),
        ).toBeInTheDocument();
      });
    });

    it('muestra el mensaje de error del servidor si existe', async () => {
      const serverError = new Error('Error del servidor');
      serverError.response = { data: { message: 'Error específico del backend' } };
      axiosInstance.get.mockRejectedValueOnce(serverError);

      render(<ShippingView />);
      await waitFor(() => {
        expect(screen.getByText('Error específico del backend')).toBeInTheDocument();
      });
    });
  });

  describe('funciones auxiliares visuales', () => {
    beforeEach(async () => {
      axiosInstance.get.mockResolvedValueOnce({ data: mockShipments });
      axiosInstance.get.mockResolvedValueOnce({ data: mockOrders });
      render(<ShippingView />);
      await waitFor(() => {
        expect(screen.getByText('Envío #1')).toBeInTheDocument();
      });
    });

    it('muestra el estado del pedido desde la orden relacionada', () => {
      const statusBadge = screen.getByText('Enviado');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('bg-purple-100', 'text-purple-800');
    });

    it('si no hay orden, muestra el estado del shipment', () => {
      const statusBadge = screen.getByText('Cancelado por falta de stock');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('acorta tracking ID largos', () => {
      expect(screen.getByText(/TRK-1234…/)).toBeInTheDocument();
    });

    it('muestra tracking corto sin acortar', () => {
      expect(screen.getByText('SHORT123')).toBeInTheDocument();
    });

    it('muestra "N/A" si estimatedDays es null', () => {
      const shipmentCard = screen.getByText('Envío #2').closest('.border');
      expect(shipmentCard).toHaveTextContent('N/A');
    });
  });

  describe('búsqueda por código de seguimiento', () => {
    beforeEach(async () => {
      axiosInstance.get.mockResolvedValueOnce({ data: mockShipments });
      axiosInstance.get.mockResolvedValueOnce({ data: mockOrders });
    });

    it('busca un tracking existente y abre el modal con los datos', async () => {
      const foundShipment = {
        ...mockShipments[0],
        trackingId: 'TRK-1234567890ABCDEF',
      };
      axiosInstance.get.mockResolvedValueOnce({ data: foundShipment });

      render(<ShippingView />);
      await waitFor(() => {
        expect(screen.getByText('Envío #1')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Pega aquí el Tracking ID completo/i);
      await userEvent.type(input, 'TRK-1234567890ABCDEF');
      const buscarBtn = screen.getByRole('button', { name: /buscar/i });
      buscarBtn.click();

      await waitFor(() => {
        expect(screen.getByText(/Detalles del Envío #1/)).toBeInTheDocument();
      });

      const modal = screen.getByText(/Detalles del Envío #1/).closest('.fixed');
      expect(within(modal).getByText('Juan Pérez')).toBeInTheDocument();
      expect(within(modal).getByText(/Calle Falsa 123/)).toBeInTheDocument();
    });

    it('muestra mensaje de error si no encuentra el tracking', async () => {
      axiosInstance.get.mockRejectedValueOnce(new Error('Network error'));

      render(<ShippingView />);
      await waitFor(() => {
        expect(screen.getByText('Envío #1')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Pega aquí el Tracking ID completo/i);
      await userEvent.type(input, 'BADTRACK');
      const buscarBtn = screen.getByRole('button', { name: /buscar/i });
      buscarBtn.click();

      await waitFor(() => {
        expect(
          screen.getByText('No se encontró un envío con ese código de seguimiento'),
        ).toBeInTheDocument();
      });
    });

    it('no hace nada si el input está vacío', async () => {
      render(<ShippingView />);
      await waitFor(() => {
        expect(screen.getByText('Envío #1')).toBeInTheDocument();
      });

      const buscarBtn = screen.getByRole('button', { name: /buscar/i });
      buscarBtn.click();

      await waitFor(() => {
        expect(screen.queryByText(/Detalles del Envío #/)).not.toBeInTheDocument();
      });
      expect(axiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('muestra "Buscando..." en el botón durante la búsqueda', async () => {
      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      axiosInstance.get.mockResolvedValueOnce({ data: mockShipments });
      axiosInstance.get.mockResolvedValueOnce({ data: mockOrders });
      axiosInstance.get.mockResolvedValueOnce(promise); // la búsqueda

      render(<ShippingView />);
      await waitFor(() => {
        expect(screen.getByText('Envío #1')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Pega aquí el Tracking ID completo/i);
      await userEvent.type(input, 'TRK-123');
      const buscarBtn = screen.getByRole('button', { name: /buscar/i });
      buscarBtn.click();

      // Esperamos al re-render que muestra "Buscando..."
      await waitFor(() => {
        expect(screen.getByText('Buscando...')).toBeInTheDocument();
      });

      resolvePromise({ data: mockShipments[0] });
      await waitFor(() => {
        expect(screen.queryByText('Buscando...')).not.toBeInTheDocument();
      });
    });
  });

  describe('modal de detalles', () => {
    beforeEach(async () => {
      axiosInstance.get.mockResolvedValueOnce({ data: mockShipments });
      axiosInstance.get.mockResolvedValueOnce({ data: mockOrders });
      render(<ShippingView />);
      await waitFor(() => {
        expect(screen.getByText('Envío #1')).toBeInTheDocument();
      });
    });

    const openModal = () => {
      const detailButtons = screen.getAllByText('Ver Detalles del Envío');
      detailButtons[0].click();
    };

    it('abre el modal con la información correcta del shipment y la orden', async () => {
      openModal();
      await waitFor(() => {
        expect(screen.getByText(/Detalles del Envío #1/)).toBeInTheDocument();
      });

      const modal = screen.getByText(/Detalles del Envío #1/).closest('.fixed');

      expect(within(modal).getByText('Enviado')).toBeInTheDocument();
      expect(within(modal).getByText(/#101/)).toBeInTheDocument();
      expect(within(modal).getByText(/TRK-1234567890ABCDEF/)).toBeInTheDocument();
      expect(within(modal).getByText('Express')).toBeInTheDocument();
      expect(within(modal).getByText('3 días')).toBeInTheDocument();
      expect(within(modal).getByText('Juan Pérez')).toBeInTheDocument();
      expect(within(modal).getByText('Calle Falsa 123')).toBeInTheDocument();
    });

    it('cierra el modal al hacer clic en "Cerrar Panel"', async () => {
      openModal();
      await waitFor(() => {
        expect(screen.getByText(/Detalles del Envío #1/)).toBeInTheDocument();
      });

      screen.getByText('Cerrar Panel').click();
      await waitFor(() => {
        expect(screen.queryByText(/Detalles del Envío #1/)).not.toBeInTheDocument();
      });
    });

    it('copia el tracking ID al portapapeles', async () => {
      const writeTextMock = vi.fn();
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock },
      });

      openModal();
      await waitFor(() => {
        expect(screen.getByText(/TRK-1234567890ABCDEF/)).toBeInTheDocument();
      });

      screen.getByText('Copiar').click();
      expect(writeTextMock).toHaveBeenCalledWith('TRK-1234567890ABCDEF');
    });

    it('muestra "Sin estado" si no hay order ni shipment.status', async () => {
      cleanup(); // Limpia renders previos para evitar duplicados

      const shipmentSinEstado = {
        id: 4,
        orderId: 999,
        trackingId: 'NO-STATUS',
        shippingType: 'Normal',
        estimatedDays: 1,
        status: undefined,
        createdAt: '2025-01-01',
      };

      axiosInstance.get.mockReset();
      axiosInstance.get.mockResolvedValueOnce({ data: [shipmentSinEstado] });
      axiosInstance.get.mockResolvedValueOnce({ data: [] });

      render(<ShippingView />);
      await waitFor(() => {
        expect(screen.getByText('Envío #4')).toBeInTheDocument();
      });

      screen.getByText('Ver Detalles del Envío').click();

      await waitFor(() => {
        expect(screen.getByText('Sin estado')).toBeInTheDocument();
      });
    });

    it('no muestra datos de cliente si no existe orden', async () => {
      const detailButtons = screen.getAllByText('Ver Detalles del Envío');
      detailButtons[2].click(); // Envío #3
      await waitFor(() => {
        expect(screen.getByText(/Detalles del Envío #3/)).toBeInTheDocument();
      });

      expect(screen.queryByText('Datos del Cliente')).not.toBeInTheDocument();
    });
  });
});