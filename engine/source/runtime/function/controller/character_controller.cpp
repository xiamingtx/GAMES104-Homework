#include "runtime/function/controller/character_controller.h"

#include "runtime/core/base/macro.h"

#include "runtime/function/framework/component/motor/motor_component.h"
#include "runtime/function/framework/world/world_manager.h"
#include "runtime/function/global/global_context.h"
#include "runtime/function/physics/physics_scene.h"

namespace Piccolo
{
    CharacterController::CharacterController(const Capsule& capsule) : m_capsule(capsule)
    {
        m_rigidbody_shape                                    = RigidBodyShape();
        m_rigidbody_shape.m_geometry                         = PICCOLO_REFLECTION_NEW(Capsule);
        *static_cast<Capsule*>(m_rigidbody_shape.m_geometry) = m_capsule;

        m_rigidbody_shape.m_type = RigidBodyShapeType::capsule;

        Quaternion orientation;
        orientation.fromAngleAxis(Radian(Degree(90.f)), Vector3::UNIT_X);

        m_rigidbody_shape.m_local_transform =
            Transform(Vector3(0, 0, capsule.m_half_height + capsule.m_radius), orientation, Vector3::UNIT_SCALE);
    }

    Vector3 CharacterController::move(const Vector3& current_position, const Vector3& displacement)
    {
        // Get active physical scene from the global context and perform null pointer checking
        std::shared_ptr<PhysicsScene> physics_scene =
            g_runtime_global_context.m_world_manager->getCurrentActivePhysicsScene().lock();
        ASSERT(physics_scene);

        // decompose the motion components 
        Vector3 horizontal_displacement = Vector3(displacement.x, 0, displacement.z);
        Vector3 horizontal_direction    = horizontal_displacement.normalisedCopy();
        Vector3 vertical_displacement = Vector3(0, displacement.y, 0);
        Vector3 horizontal_move_position = current_position + displacement;

        // init final_position variable
        Vector3 final_position = current_position;
        Transform final_transform = Transform(final_position, Quaternion::IDENTITY, Vector3::UNIT_SCALE);

        // Collision detection in the horizontal direction
        std::vector<PhysicsHitInfo> hits;
        if (physics_scene->sweep(m_rigidbody_shape, final_transform.getMatrix(),
                                horizontal_direction, horizontal_displacement.length(), hits))
        {
            final_position += horizontal_displacement - hits[0].hit_normal.dotProduct(horizontal_displacement) /
                                                            hits[0].hit_normal.length() *
                                                            hits[0].hit_normal.normalisedCopy();
        }
        else
            final_position += horizontal_displacement;

        final_transform.m_position = final_position + vertical_displacement;

        // Overlap detection of vertical displacement
        if (!physics_scene->isOverlap(m_rigidbody_shape, final_transform.getMatrix()))
        {
            final_position += vertical_displacement;
        }

        return final_position;
    }
} // namespace Piccolo
