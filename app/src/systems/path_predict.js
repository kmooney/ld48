import { System } from "ecsy"
import { Physics2dComponent } from "../../../src/core/components/physics2d"
import { OrbitComponent } from "../components/orbit"
import { GravityComponent, PlanetaryComponent } from "../components/gravity"
import { GravitySystem } from "./gravity"
import { OrbitSystem } from "./orbit"
import { PredictorComponent } from "../components/path_predict"
import { Obj3dComponent } from "../../../src/core/components/render"
import * as THREE from "three"

export class PathPredictorSystem extends System {

    planet_positions(){
        return this.queries.planets.results.map( p => { 
            const pc = p.getComponent(PlanetaryComponent)
            const planet = {
                pos:p.getComponent(Physics2dComponent).body.getPosition().clone(),
                mass:pc.mass,
                radius: pc.radius,
                land_vel: pc.land_vel,
                distance: null,
                orbit_radius: null,
                avel: null,
                aoffset: null,
                center: null,
            }
            if(p.hasComponent(OrbitComponent)){
                const orbit = p.getComponent(OrbitComponent)
                planet.orbit_radius = orbit.radius 
                planet.avel = orbit.avel
                planet.aoffset = orbit.aoffset
                planet.center = orbit.center
            }
            return planet
        })
    }

    execute(delta,time){
        const gsys = this.world.getSystem(GravitySystem)
        const osys = this.world.getSystem(OrbitSystem)

        const planets = this.planet_positions() 

        this.queries.predictors.results.forEach( e => {
            const predict = e.getMutableComponent(PredictorComponent)
            const body = e.getComponent(Physics2dComponent).body
            const obj3d = e.getComponent(Obj3dComponent).obj
            const predictor_mesh = obj3d.children[4]
            const mass = body.getMass()
            const pos0 = body.getPosition()
            const pos = pos0.clone()
            const vel = body.getLinearVelocity().clone()

            const t0 = time
            const predictions = []
            let landing = null
            for(var t=0;t<predict.ticks; t++){
                const t1 = time + (t*predict.delta)
                // step all planets
                planets.forEach( p=>{
                    if(p.orbit_radius){
                        p.pos = osys.step_orbit_pos(p.avel,p.aoffset,p.orbit_radius,p.center,t1)
                    }
                })

                // calculate force
                const g = gsys.cumulative_gravity(pos,mass,planets)

                const accel = g.mul(1/mass)
                // new velocity = old_vel + accel * t
                vel.add(accel.mul(predict.delta)) 
                const d = vel.clone().mul(predict.delta) 
                // step velocity position
                pos.add(d)
                // add to prediction array, but translate to local coords
                predictions.push(
                    obj3d.worldToLocal(new THREE.Vector3(pos.x,pos.y, 0))
                )

                const impacts = planets.filter( p => p.distance < p.radius )
                if(impacts.length > 0){
                    landing = vel.length() < impacts[0].land_vel
                    break
                }
            }
            // Now what with predictions?
            //console.log(predictions)
            predictor_mesh.geometry.setFromPoints(predictions)
            switch(landing){
                case null:
                    predictor_mesh.material.color.setHex(0x00aaff)
                    break
                case true:
                    predictor_mesh.material.color.setHex(0x00ff00)
                    break;
                case false:
                    predictor_mesh.material.color.setHex(0xff0000)
                    break;
            }
            predict.landing = landing
        })
    }
}

PathPredictorSystem.queries = {
    predictors: {
        components: [PredictorComponent,GravityComponent,Physics2dComponent]
    },
    planets: {
        components: [PlanetaryComponent,Physics2dComponent]
    },
}
