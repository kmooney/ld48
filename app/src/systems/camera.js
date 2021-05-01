import { System } from "ecsy"
import { CameraComponent } from "../../../src/core/components/render"


class CameraSystem extends System {
    execute(delta, time) {
        var camera = this.queries.camera[0].getComponent(CameraComponent)
        camera.lookAt.z += 0.01
    }
}

CameraSystem.queries = {
    camera: {
        components: [CameraComponent]
    }
}