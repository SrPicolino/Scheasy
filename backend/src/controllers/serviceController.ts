import { Request, Response } from 'express';
import prisma from '../prisma';

/**
 * GET /api/services?barbershopId=xxx
 * Returns services filtered by barbershopId (required for multi-tenant)
 */
export const getServices = async (req: Request, res: Response) => {
  const { barbershopId } = req.query;
  try {
    const where = barbershopId ? { barbershopId: String(barbershopId) } : {};
    const services = await prisma.service.findMany({ where });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

/**
 * POST /api/services
 * Creates a service associated with a specific barbershop
 */
export const createService = async (req: Request, res: Response) => {
  const { name, description, price, duration, barbershopId } = req.body;

  if (!barbershopId) {
    return res.status(400).json({ error: 'barbershopId é obrigatório.' });
  }

  try {
    const service = await prisma.service.create({
      data: { name, description, price, duration, barbershopId },
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service' });
  }
};

/**
 * PUT /api/services/:id
 * Updates a service
 */
export const updateService = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, price, duration } = req.body;
  try {
    const service = await prisma.service.update({
      where: { id },
      data: { name, description, price, duration },
    });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service' });
  }
};

/**
 * DELETE /api/services/:id
 * Deletes a service
 */
export const deleteService = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.service.delete({ where: { id } });
    res.json({ message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
};
