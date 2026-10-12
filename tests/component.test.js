import { describe, it, expect, beforeEach, afterEach } from "./tester.js";
import { Component } from "../src/neptune.js";

describe('Component', () => {
    let component;

    beforeEach(() => {
        component = new Component();
    });

    afterEach(() => {
        component = null;
    });

    it('creates a component with _properties object', () => {
        expect(component._properties).toBeDefined();
    });

    it('_properties is an empty object by default', () => {
        expect(JSON.stringify(component._properties)).toBe('{}');
    });

    it('can store properties on _properties', () => {
        component._properties.testValue = 42;
        expect(component._properties.testValue).toBe(42);
    });

    it('entity is initially null', () => {
        expect(component.entity).toBeNull();
    });

    it('can set entity reference', () => {
        const mockEntity = { name: 'TestEntity' };
        component.entity = mockEntity;
        expect(component.entity).toBe(mockEntity);
    });

    it('destroy method exists', () => {
        expect(typeof component.destroy).toBe('function');
    });

    it('destroy can be called without error', () => {
        expect(() => component.destroy()).not.toThrow();
    });
});
